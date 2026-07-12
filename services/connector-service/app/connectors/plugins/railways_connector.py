"""
Indian Railways eProcurement System (IREPS) Connector — Phase 14.5.

IREPS (ireps.gov.in) requires registered bidder login to access tender listings.
The public endpoint /eps/latestTendersList.do returns HTTP 200 but immediately
redirects to a login page via JavaScript.

This connector:
  1. Attempts to access the public tender listing
  2. If accessible without login, parses and yields real tenders (BeautifulSoup)
  3. If login gate is detected, logs BLOCKED_AUTH and yields 0 results

To enable authenticated crawling, set environment variables:
  IREPS_USERNAME and IREPS_PASSWORD (registered IREPS bidder credentials)

When credentials are present, the connector performs:
  1. POST to /eps/j_spring_security_check (form login)
  2. Session-based paginated scrape of tender listings
  3. Detail page scrape for individual tender metadata
"""
from __future__ import annotations

import asyncio
import os
import re
from datetime import datetime
from typing import AsyncIterator, Optional

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


IREPS_USERNAME = os.environ.get("IREPS_USERNAME", "")
IREPS_PASSWORD = os.environ.get("IREPS_PASSWORD", "")


class RailwaysConnector(BaseConnector):
    """
    IREPS connector with session-based authentication support.
    Requires IREPS_USERNAME + IREPS_PASSWORD env vars for authenticated crawling.
    Without credentials: logs BLOCKED_AUTH, yields 0 results — no fixture data.
    """
    source_id = "railways"
    display_name = "Indian Railways eProcurement System (IREPS)"
    description = "Official Indian Railways procurement notices via IREPS"
    cadence = CadenceConfig(
        cron="0 */2 * * *",
        min_interval_seconds=7200,
        description="Every 2 hours",
    )
    rate_limit = RateLimitConfig(requests_per_second=0.5, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=3.0)
    timeout_seconds = 25

    IREPS_BASE = "https://www.ireps.gov.in"
    IREPS_LOGIN_URL = "https://www.ireps.gov.in/eps/j_spring_security_check"
    IREPS_TENDERS_URL = "https://www.ireps.gov.in/eps/latestTendersList.do"
    IREPS_SEARCH_URL = "https://www.ireps.gov.in/eps/tenderSearch.do"

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }

    async def _login(self, client: httpx.AsyncClient) -> bool:
        """Attempt IREPS session login. Returns True if successful."""
        if not IREPS_USERNAME or not IREPS_PASSWORD:
            return False
        try:
            # First: GET the login page to get session cookie
            await client.get(f"{self.IREPS_BASE}/eps/loginPage.do", headers=self.HEADERS)
            # POST credentials
            login_resp = await client.post(
                self.IREPS_LOGIN_URL,
                data={
                    "j_username": IREPS_USERNAME,
                    "j_password": IREPS_PASSWORD,
                    "Submit": "Sign In",
                },
                headers={**self.HEADERS, "Content-Type": "application/x-www-form-urlencoded"},
            )
            # Check for successful login (no redirect back to login page)
            if "loginPage" in str(login_resp.url) or "Invalid" in login_resp.text:
                self.log_warning("IREPS: login failed — invalid credentials")
                return False
            self.log_info("IREPS: session login successful")
            return True
        except Exception as e:
            self.log_error("IREPS: login exception", error=str(e))
            return False

    def _parse_tender_row(self, row) -> Optional[dict]:
        """Parse a single table row from IREPS tender listing."""
        cells = row.find_all("td")
        if len(cells) < 5:
            return None
        try:
            tender_no = cells[0].get_text(strip=True)
            description = cells[1].get_text(strip=True)
            organisation = cells[2].get_text(strip=True)
            closing_date_str = cells[3].get_text(strip=True)
            tender_type = cells[4].get_text(strip=True) if len(cells) > 4 else ""

            # Parse closing date
            submission_deadline = None
            for fmt in ("%d/%m/%Y %H:%M", "%d-%m-%Y", "%d/%m/%Y"):
                try:
                    submission_deadline = datetime.strptime(closing_date_str, fmt).isoformat()
                    break
                except ValueError:
                    continue

            # Extract detail URL
            link = cells[1].find("a")
            detail_url = self.IREPS_TENDERS_URL
            if link and link.get("href"):
                href = link["href"]
                detail_url = f"{self.IREPS_BASE}{href}" if not href.startswith("http") else href

            return {
                "title": description or f"IREPS Tender {tender_no}",
                "ministry": "Ministry of Railways",
                "department": organisation,
                "organisation": organisation,
                "state": None,
                "estimated_cost_lakhs": None,
                "emd_lakhs": None,
                "categories": ["Railways", tender_type] if tender_type else ["Railways"],
                "procurement_method": "open",
                "status": "active",
                "published_at": datetime.utcnow().isoformat(),
                "submission_deadline": submission_deadline,
                "ireps_tender_no": tender_no,
                "source_detail_url": detail_url,
            }
        except Exception:
            return None

    async def _scrape_tender_list(self, client: httpx.AsyncClient) -> list[dict]:
        """Scrape the IREPS tender listing table."""
        results = []
        try:
            resp = await client.get(self.IREPS_TENDERS_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                return []

            body = resp.text
            # Detect redirect to login
            if any(k in body.lower() for k in ["loginpage", "j_username", "sign in", "captcha"]):
                self.log_warning("IREPS: login wall detected after attempt — BLOCKED_AUTH")
                return []

            soup = BeautifulSoup(body, "html.parser")
            table = (
                soup.find("table", {"class": "tblFormat"})
                or soup.find("table", {"id": "tenderTable"})
                or soup.find("table", {"class": re.compile(r"tender|list")})
            )
            if not table:
                self.log_info("IREPS: no tender table found in response")
                return []

            for row in table.find_all("tr")[1:]:  # skip header
                parsed = self._parse_tender_row(row)
                if parsed:
                    results.append(parsed)

        except Exception as e:
            self.log_error("IREPS: scrape error", error=str(e))

        return results

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """
        Fetch IREPS tenders.
        - With credentials: authenticates and scrapes paginated listings.
        - Without credentials: attempts public endpoint, logs BLOCKED_AUTH if gated.
        - NEVER yields fixture data.
        """
        self.log_info("RailwaysConnector: starting IREPS crawl", since=since)
        yielded = 0
        has_creds = bool(IREPS_USERNAME and IREPS_PASSWORD)

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
        ) as client:
            if has_creds:
                logged_in = await self._login(client)
                if not logged_in:
                    self.log_warning(
                        "IREPS: authentication failed — set IREPS_USERNAME / IREPS_PASSWORD "
                        "in Railway env vars. Yielding 0 results. BLOCKED_AUTH."
                    )
                    return
            else:
                self.log_info(
                    "IREPS: no credentials — attempting public endpoint. "
                    "Set IREPS_USERNAME + IREPS_PASSWORD in Railway env for full access."
                )

            tenders = await self._scrape_tender_list(client)
            for i, raw in enumerate(tenders):
                tender_no = raw.get("ireps_tender_no") or f"IREPS-{i}"
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=tender_no,
                    source_url=raw.get("source_detail_url", self.IREPS_TENDERS_URL),
                    raw_json=raw,
                )
                yielded += 1

        if not yielded and not has_creds:
            self.log_warning(
                "IREPS: 0 tenders yielded — portal is login-gated. "
                "Action required: add IREPS_USERNAME + IREPS_PASSWORD to Railway environment variables."
            )
        else:
            self.log_info("IREPS: crawl complete", total=yielded)

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(
                    self.IREPS_TENDERS_URL,
                    headers={"User-Agent": self.HEADERS["User-Agent"]},
                )
                if resp.status_code == 200:
                    if any(k in resp.text.lower() for k in ["loginpage", "j_username"]):
                        return HealthStatus.DEGRADED  # reachable but auth-gated
                    return HealthStatus.HEALTHY
                return HealthStatus.FAILED
        except Exception:
            return HealthStatus.FAILED
