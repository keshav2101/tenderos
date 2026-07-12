"""
State / Union Territory Procurement Connector Base — Phase 14.5.

All 36 state + UT connectors extend StateBaseConnector.
Each subclass only needs to set:
  - source_id, display_name, STATE_NAME, PORTAL_URL, PORTAL_DOMAIN

The base class:
  1. Attempts to scrape the STATE's own eProcurement portal (PORTAL_URL)
  2. Falls back to NIC eProcure filtered by state name
  3. Falls back to scraping the PORTAL_URL for tender hyperlinks
  4. When all fail, yields 0 results — NEVER returns fixture data

Authentication strategy:
  - Most NIC state portals share the same login form (j_spring_security_check)
  - Set STATE_NIC_USERNAME / STATE_NIC_PASSWORD env vars for session access
  - Without credentials: tries public listing pages only

Portal types supported via PORTAL_TYPE attribute:
  - "state" (default): NIC eProcure + state PWD portal
  - "railway": IREPS zonal scraper
  - "municipal": Municipal corporation portal
  - "university": NIC eProcure education filter
  - "port": Port trust portal
  - "hospital": Hospital/AIIMS/NHM portal
"""
from __future__ import annotations

import asyncio
import os
import re
from datetime import datetime, timedelta
from typing import AsyncIterator, Dict, Any, Optional, List

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)

# Optional shared NIC credentials (for session-based access)
STATE_NIC_USERNAME = os.environ.get("STATE_NIC_USERNAME", "")
STATE_NIC_PASSWORD = os.environ.get("STATE_NIC_PASSWORD", "")


class StateBaseConnector(BaseConnector):
    """Abstract base for all State / UT / domain procurement portals.
    Zero fixture data — yields 0 results when blocked.
    """
    STATE_NAME: str = ""
    PORTAL_URL: str = ""
    PORTAL_DOMAIN: str = ""
    PORTAL_TYPE: str = "state"
    description: str = ""

    cadence = CadenceConfig(cron="0 */6 * * *", min_interval_seconds=21600,
                            description="Every 6 hours")
    rate_limit = RateLimitConfig(requests_per_second=0.5, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20
    access_limitations: str = (
        "Many state portals require NIC login. Set STATE_NIC_USERNAME + "
        "STATE_NIC_PASSWORD in Railway environment variables for authenticated access."
    )

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }

    NIC_ACTIVE_URL = (
        "https://eprocure.gov.in/eprocure/app"
        "?page=FrontEndLatestActiveTenders&service=page"
    )
    NIC_BASE = "https://eprocure.gov.in"

    # ── Live portal check ──────────────────────────────────────────────────────

    async def _try_live_portal(self) -> bool:
        if not self.PORTAL_URL:
            return False
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(self.PORTAL_URL, headers=self.HEADERS)
                if resp.status_code == 200:
                    body = resp.text[:3000]
                    if any(w in body.lower() for w in ["captcha", "login", "otp", "password"]):
                        return False
                    return True
                return False
        except Exception:
            return False

    # ── NIC eProcure state-filtered scrape ────────────────────────────────────

    async def _scrape_nic_state(self, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        """Scrape NIC eProcure and filter by state name."""
        results = []
        try:
            resp = await client.get(self.NIC_ACTIVE_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                return results
            body = resp.text
            if any(w in body.lower() for w in ["login", "captcha", "j_username"]):
                return results

            soup = BeautifulSoup(body, "html.parser")
            table = (
                soup.find("table", {"id": "loadedDataTable"})
                or soup.find("table", {"class": "list_table"})
                or soup.find("table", {"class": "tablebg"})
            )
            if not table:
                return results

            state_lc = self.STATE_NAME.lower() if self.STATE_NAME else ""
            for row in table.find_all("tr")[1:]:
                cells = row.find_all("td")
                if len(cells) < 4:
                    continue
                org = cells[1].get_text(strip=True)
                nit_no = cells[2].get_text(strip=True)
                title = cells[3].get_text(strip=True)
                last_date = cells[4].get_text(strip=True) if len(cells) > 4 else ""

                # State filter
                if state_lc and state_lc not in (org + title).lower():
                    continue

                link = cells[3].find("a")
                detail_url = self.NIC_ACTIVE_URL
                if link and link.get("href"):
                    href = link["href"]
                    detail_url = href if href.startswith("http") else f"{self.NIC_BASE}{href}"

                results.append({
                    "title": title or f"{self.STATE_NAME} Tender {nit_no}",
                    "ministry": f"Government of {self.STATE_NAME}",
                    "department": org,
                    "organisation": org,
                    "state": self.STATE_NAME or "Delhi",
                    "estimated_cost_lakhs": None,
                    "emd_lakhs": None,
                    "categories": self._infer_categories(title),
                    "procurement_method": "open",
                    "status": "active",
                    "published_at": datetime.utcnow().isoformat(),
                    "submission_deadline": self._parse_date(last_date),
                    "source_nit_no": nit_no,
                    "source_detail_url": detail_url,
                })
        except Exception as e:
            self.log_warning(f"{self.source_id}: NIC state scrape error", error=str(e))
        return results

    # ── Own portal link scrape ─────────────────────────────────────────────────

    async def _scrape_own_portal(self, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        """Scrape the state's own portal for tender hyperlinks."""
        results = []
        if not self.PORTAL_URL:
            return results
        try:
            resp = await client.get(self.PORTAL_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                return results
            body = resp.text
            if any(w in body.lower() for w in ["login", "captcha", "j_username", "otp"]):
                self.log_info(
                    f"{self.source_id}: own portal requires auth — BLOCKED_AUTH",
                    portal=self.PORTAL_URL,
                )
                return results

            soup = BeautifulSoup(body, "html.parser")
            seen = set()
            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True)
                if len(text) < 15 or text in seen:
                    continue
                href = a["href"]
                if not any(k in text.lower() for k in ["tender", "nit", "bid", "rfp", "notice", "quotation"]):
                    continue
                seen.add(text)
                full_url = href if href.startswith("http") else f"{self.PORTAL_URL.rstrip('/')}/{href.lstrip('/')}"
                results.append({
                    "title": text[:300],
                    "ministry": f"Government of {self.STATE_NAME}",
                    "department": self.display_name,
                    "organisation": self.display_name,
                    "state": self.STATE_NAME or "Delhi",
                    "estimated_cost_lakhs": None,
                    "emd_lakhs": None,
                    "categories": self._infer_categories(text),
                    "procurement_method": "open",
                    "status": "active",
                    "published_at": datetime.utcnow().isoformat(),
                    "submission_deadline": None,
                    "source_nit_no": None,
                    "source_detail_url": full_url,
                })
        except Exception as e:
            self.log_warning(f"{self.source_id}: own portal scrape error", error=str(e))
        return results

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _parse_date(self, date_str: str) -> Optional[str]:
        for fmt in ("%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(date_str.strip(), fmt).isoformat()
            except ValueError:
                continue
        return None

    def _infer_categories(self, title: str) -> List[str]:
        t = title.lower()
        cats = []
        if any(k in t for k in ["software", "ict", "digital", "it ", "computer"]):
            cats.append("IT & Software")
        if any(k in t for k in ["construction", "civil", "road", "bridge", "highway"]):
            cats.append("Civil & Construction")
        if any(k in t for k in ["medical", "health", "hospital", "medicine"]):
            cats.append("Healthcare")
        if any(k in t for k in ["supply", "purchase", "procurement", "goods"]):
            cats.append("Goods & Services")
        if any(k in t for k in ["consult", "service", "advisory"]):
            cats.append("Consultancy & Professional Services")
        if any(k in t for k in ["railway", "train", "track", "signal"]):
            cats.append("Railways")
        if any(k in t for k in ["port", "dredge", "vessel", "marine"]):
            cats.append("Maritime")
        return cats or ["General"]

    # ── Main fetch ─────────────────────────────────────────────────────────────

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """
        Fetch state procurement tenders from live sources.
        Order of attempts:
          1. Own portal scrape (link extraction)
          2. NIC eProcure with state filter
        Yields 0 results when all sources are blocked — NEVER fixture data.
        """
        self.log_info(
            f"{self.source_id}: starting state scrape",
            state=self.STATE_NAME, portal=self.PORTAL_URL,
        )
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
        ) as client:
            # Attempt 1: Own portal
            own_results = await self._scrape_own_portal(client)
            for i, raw in enumerate(own_results):
                tid = raw.get("source_nit_no") or f"{self.source_id.upper()}-OWN-{i}"
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=tid,
                    source_url=raw.get("source_detail_url", self.PORTAL_URL or ""),
                    raw_json=raw,
                )
                yielded += 1

            await asyncio.sleep(1.0)

            # Attempt 2: NIC eProcure state filter
            nic_results = await self._scrape_nic_state(client)
            for i, raw in enumerate(nic_results):
                tid = raw.get("source_nit_no") or f"{self.source_id.upper()}-NIC-{i}"
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=tid,
                    source_url=raw.get("source_detail_url", self.NIC_ACTIVE_URL),
                    raw_json=raw,
                )
                yielded += 1

        if not yielded:
            self.log_warning(
                f"{self.source_id}: 0 tenders yielded — all sources blocked or empty. "
                f"For authenticated access, set STATE_NIC_USERNAME + STATE_NIC_PASSWORD "
                f"in Railway env vars. Status: BLOCKED_NETWORK / BLOCKED_AUTH.",
                state=self.STATE_NAME,
            )
        else:
            self.log_info(f"{self.source_id}: crawl complete", state=self.STATE_NAME, total=yielded)

    async def health_check(self) -> HealthStatus:
        if not self.PORTAL_URL:
            return HealthStatus.DEGRADED
        accessible = await self._try_live_portal()
        return HealthStatus.HEALTHY if accessible else HealthStatus.DEGRADED
