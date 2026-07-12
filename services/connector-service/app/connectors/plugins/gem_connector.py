"""
GeM (Government e-Marketplace) Connector — Phase 14.5.

Uses the official GeM portal bid listing with a full cookie-jar session.
Strategy:
  1. GET /all-bids → sets session cookie, extracts CSRF token from JS/HTML
  2. POST /all-bids-data with cookie jar + CSRF token → receive JSON docs
  3. Paginate through all available pages

If GeM returns 403/419 (WAF block from non-Indian IP), the connector:
  - logs BLOCKED_NETWORK
  - yields 0 results
  - NEVER falls back to fixture data

Rate limit: 3 req/sec (official GeM API guidance)
"""
from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timedelta
from typing import AsyncIterator, Optional

import httpx

from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class GeMConnector(BaseConnector):
    """
    Connector for Government e-Marketplace (GeM).
    Full cookie-jar session implementation. No fixture data fallback.
    """
    source_id = "gem"
    display_name = "Government e-Marketplace (GeM)"
    description = "Official GeM procurement portal — Bids and Tenders"
    cadence = CadenceConfig(
        cron="*/20 * * * *",
        min_interval_seconds=1200,
        description="Every 20 minutes — GeM updates frequently",
    )
    rate_limit = RateLimitConfig(requests_per_second=2.0, burst=4)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0, max_backoff_seconds=120.0)
    timeout_seconds = 30

    GEM_ALL_BIDS_URL = "https://bidplus.gem.gov.in/all-bids"
    GEM_BIDS_DATA_URL = "https://bidplus.gem.gov.in/all-bids-data"
    GEM_BID_DETAIL_URL = "https://bidplus.gem.gov.in/showbidDocument/{bid_id}"

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    }

    POST_HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://bidplus.gem.gov.in",
        "Referer": "https://bidplus.gem.gov.in/all-bids",
    }

    def _extract_csrf(self, html: str) -> Optional[str]:
        """Extract CSRF token from GeM bid listing HTML."""
        patterns = [
            r"csrf_bd_gem_nk'\s*:\s*'([a-f0-9]+)'",
            r'csrf_bd_gem_nk"\s*:\s*"([a-f0-9]+)"',
            r"window\.csrf\s*=\s*['\"]([a-f0-9]+)['\"]",
            r'name="csrf_bd_gem_nk"\s+value="([a-f0-9]+)"',
            r"csrf_token['\"]?\s*:\s*['\"]([a-f0-9]+)['\"]",
        ]
        for pattern in patterns:
            m = re.search(pattern, html)
            if m:
                return m.group(1)
        return None

    def _parse_raw_bid(self, raw: dict) -> dict:
        """Map GeM Solr doc fields to the normalizer's expected schema."""
        bid_no = (raw.get("b_bid_number") or [""])[0]
        b_id = raw.get("id", "")
        org = (raw.get("b_organisation_name") or [""])[0]
        title = (raw.get("b_title") or [""])[0] or (raw.get("b_bid_description") or [""])[0]
        category = (raw.get("b_cat_name") or [""])[0]
        ministry_code = (raw.get("b_ministry_code") or [""])[0]
        ministry = (raw.get("b_ministry_name") or [""])[0]
        state_code = (raw.get("b_state") or [""])[0]
        end_date_str = (raw.get("b_bidding_end_date") or [""])[0]
        start_date_str = (raw.get("b_bid_start_date") or [""])[0]
        estimated_value = raw.get("b_est_amount", [None])[0] if isinstance(raw.get("b_est_amount"), list) else raw.get("b_est_amount")

        # Parse dates
        submission_deadline = None
        for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%Y-%m-%dT%H:%M:%S", "%d-%m-%Y"):
            try:
                submission_deadline = datetime.strptime(end_date_str, fmt).isoformat()
                break
            except (ValueError, TypeError):
                continue

        published_at = None
        for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%Y-%m-%dT%H:%M:%S"):
            try:
                published_at = datetime.strptime(start_date_str, fmt).isoformat()
                break
            except (ValueError, TypeError):
                continue

        # Convert estimated value (GeM reports in INR) to Lakhs
        estimated_cost_lakhs = None
        try:
            if estimated_value:
                estimated_cost_lakhs = round(float(estimated_value) / 100000, 2)
        except (ValueError, TypeError):
            pass

        return {
            "title": title or f"GeM Bid {bid_no}",
            "ministry": ministry,
            "department": org,
            "organisation": org,
            "state": state_code or "Delhi",
            "estimated_cost_lakhs": estimated_cost_lakhs,
            "emd_lakhs": None,
            "categories": [category] if category else ["Goods & Services"],
            "procurement_method": "gem",
            "status": "active",
            "published_at": published_at or datetime.utcnow().isoformat(),
            "submission_deadline": submission_deadline,
            "gem_bid_number": bid_no,
            "gem_id": b_id,
            "msme_eligible": bool(raw.get("b_msme_exemption")),
            "startup_eligible": bool(raw.get("b_startup_exemption")),
            "make_in_india": bool(raw.get("b_mii")),
        }

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """
        Fetch live tenders from GeM using full cookie-jar session.
        Yields 0 results (never fixture) if WAF blocks access.
        """
        self.log_info("GeMConnector: starting live session crawl", since=since)
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            headers=self.HEADERS,
        ) as client:
            # ── Step 1: Establish session + extract CSRF ──────────────────────
            csrf_token: Optional[str] = None
            try:
                resp_init = await client.get(self.GEM_ALL_BIDS_URL)
                if resp_init.status_code != 200:
                    self.log_warning(
                        "GeMConnector: initial page non-200 — BLOCKED_NETWORK",
                        status=resp_init.status_code,
                    )
                    return

                csrf_token = self._extract_csrf(resp_init.text)
                if not csrf_token:
                    self.log_warning(
                        "GeMConnector: CSRF token not found in HTML — session may have changed"
                    )
            except Exception as init_err:
                self.log_error("GeMConnector: session init failed", error=str(init_err))
                return

            # ── Step 2: Paginate through bids ─────────────────────────────────
            max_pages = 10  # ~200 bids per crawl cycle
            for page in range(1, max_pages + 1):
                try:
                    payload_json = json.dumps({
                        "page": page,
                        "filter": {
                            "byEndDate": {"from": "", "to": ""},
                            "sort": "Bid-Start-Date-Latest",
                            "searchBid": "",
                        },
                    })
                    form_data = {
                        "payload": payload_json,
                        "csrf_bd_gem_nk": csrf_token or "",
                    }

                    resp_data = await client.post(
                        self.GEM_BIDS_DATA_URL,
                        data=form_data,
                        headers=self.POST_HEADERS,
                    )

                    # Handle WAF/session block
                    if resp_data.status_code in (403, 419, 429, 503):
                        self.log_warning(
                            "GeMConnector: POST blocked — BLOCKED_NETWORK",
                            status=resp_data.status_code,
                            page=page,
                        )
                        # Try CSRF refresh once
                        if csrf_token and resp_data.status_code in (403, 419):
                            self.log_info("GeMConnector: attempting CSRF refresh")
                            try:
                                refresh_resp = await client.get(self.GEM_ALL_BIDS_URL)
                                new_csrf = self._extract_csrf(refresh_resp.text)
                                if new_csrf and new_csrf != csrf_token:
                                    csrf_token = new_csrf
                                    continue  # retry with new CSRF
                            except Exception:
                                pass
                        break  # Give up — no fixture fallback

                    if resp_data.status_code != 200:
                        self.log_warning(
                            "GeMConnector: unexpected status on POST",
                            status=resp_data.status_code, page=page,
                        )
                        break

                    # Parse JSON response
                    try:
                        data = resp_data.json()
                    except Exception:
                        # Might be HTML login redirect
                        if "login" in resp_data.text.lower():
                            self.log_warning("GeMConnector: redirected to login page — BLOCKED_AUTH")
                        break

                    docs: list = (
                        data.get("response", {})
                        .get("response", {})
                        .get("docs", [])
                    )
                    if not docs:
                        self.log_info("GeMConnector: empty docs on page — stopping", page=page)
                        break

                    for raw in docs:
                        bid_id = raw.get("id", f"GEM-{page}-{yielded}")
                        bid_no = (raw.get("b_bid_number") or [f"GEM-{page}-{yielded}"])[0]
                        parsed = self._parse_raw_bid(raw)
                        yield RawTender(
                            source_id=self.source_id,
                            source_tender_id=bid_no,
                            source_url=self.GEM_BID_DETAIL_URL.format(bid_id=bid_id),
                            raw_json=parsed,
                            document_urls=[self.GEM_BID_DETAIL_URL.format(bid_id=bid_id)],
                        )
                        yielded += 1

                    self.log_info(
                        "GeMConnector: page scraped",
                        page=page, page_count=len(docs), total_so_far=yielded,
                    )
                    await asyncio.sleep(0.4)  # polite throttle

                except httpx.TimeoutException:
                    self.log_warning("GeMConnector: timeout on page", page=page)
                    break
                except Exception as page_err:
                    self.log_error("GeMConnector: page error", error=str(page_err), page=page)
                    break

        self.log_info("GeMConnector: crawl complete", total=yielded)

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(
                    self.GEM_ALL_BIDS_URL,
                    headers={"User-Agent": self.HEADERS["User-Agent"]},
                )
                if resp.status_code == 200 and "bid" in resp.text.lower():
                    return HealthStatus.HEALTHY
                return HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
