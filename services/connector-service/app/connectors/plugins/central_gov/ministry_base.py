"""
Ministry-Filtered NIC eProcure Connector Base — Phase 14.5.

All central ministry connectors extend this base.
Strategy:
  1. Scrape NIC eProcure active tenders page
  2. Filter rows by ministry-specific keywords
  3. Yield only real scraped tenders — no fixture data fallback

The RSS feed (eprocure.gov.in/cppp/latestactive/xml) is HTTP 404 and
has been removed. This base now uses HTML scraping.

If the NIC eProcure portal is unreachable or behind a login gate
(as detected from non-Indian IPs), the connector yields 0 results
and logs BLOCKED_NETWORK. Callers should use Railway/VPN for live access.
"""
from __future__ import annotations

import asyncio
import re
from datetime import datetime, timedelta
from typing import AsyncIterator, Optional, List

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class MinistryBaseConnector(BaseConnector):
    """
    Abstract base for ministry-specific NIC eProcure connectors.
    Subclasses set: source_id, display_name, MINISTRY_NAME, MINISTRY_KEYWORDS, PORTAL_URL.
    Never returns fixture data — yields 0 results when blocked.
    """
    MINISTRY_NAME: str = "Central Government"
    MINISTRY_KEYWORDS: List[str] = []
    MINISTRY_DEPT: str = "Department"
    MINISTRY_STATE: str = "Delhi"
    PORTAL_URL: str = "https://eprocure.gov.in"

    cadence = CadenceConfig(
        cron="0 */2 * * *",
        min_interval_seconds=7200,
        description="Every 2 hours",
    )
    rate_limit = RateLimitConfig(requests_per_second=0.5, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 25

    # NIC eProcure active tenders page (RSS is dead — HTTP 404)
    NIC_ACTIVE_URL = (
        "https://eprocure.gov.in/eprocure/app"
        "?page=FrontEndLatestActiveTenders&service=page"
    )
    NIC_BASE = "https://eprocure.gov.in"

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }

    def _row_matches_ministry(self, org: str, title: str) -> bool:
        """Return True if the tender row belongs to this ministry."""
        if not self.MINISTRY_KEYWORDS:
            return True  # Base connector — no filter
        text = (org + " " + title).lower()
        return any(kw.lower() in text for kw in self.MINISTRY_KEYWORDS)

    def _parse_closing_date(self, date_str: str) -> str:
        for fmt in ("%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(date_str.strip(), fmt).isoformat()
            except ValueError:
                continue
        return (datetime.utcnow() + timedelta(days=14)).isoformat()

    def _infer_state(self, org: str) -> str:
        state_map = {
            "Maharashtra": "Maharashtra", "Delhi": "Delhi", "Karnataka": "Karnataka",
            "Tamil Nadu": "Tamil Nadu", "Uttar Pradesh": "Uttar Pradesh",
            "Gujarat": "Gujarat", "Rajasthan": "Rajasthan",
            "Madhya Pradesh": "Madhya Pradesh", "West Bengal": "West Bengal",
            "Punjab": "Punjab", "Haryana": "Haryana", "Bihar": "Bihar",
            "Odisha": "Odisha", "Telangana": "Telangana", "Kerala": "Kerala",
        }
        org_lower = org.lower()
        for state, canonical in state_map.items():
            if state.lower() in org_lower:
                return canonical
        return self.MINISTRY_STATE

    async def _scrape_nic_page(self, client: httpx.AsyncClient, page_no: int) -> list[dict]:
        """Fetch and parse one NIC eProcure page, filtering by ministry."""
        results = []
        try:
            if page_no == 1:
                resp = await client.get(self.NIC_ACTIVE_URL, headers=self.HEADERS)
            else:
                resp = await client.post(
                    f"{self.NIC_BASE}/eprocure/app",
                    data={
                        "page": "FrontEndLatestActiveTenders",
                        "service": "page",
                        "pageIndex": str(page_no),
                    },
                    headers=self.HEADERS,
                )

            if resp.status_code != 200:
                return results

            body = resp.text
            # Detect login gate
            if any(w in body.lower() for w in ["login", "captcha", "j_username", "otp"]):
                self.log_warning(
                    f"{self.source_id}: NIC eProcure login gate — BLOCKED_NETWORK",
                    ministry=self.MINISTRY_NAME,
                )
                return results

            soup = BeautifulSoup(body, "html.parser")
            table = (
                soup.find("table", {"id": "loadedDataTable"})
                or soup.find("table", {"class": "list_table"})
                or soup.find("table", {"class": "tablebg"})
            )
            if not table:
                return results

            for row in table.find_all("tr")[1:]:
                cells = row.find_all("td")
                if len(cells) < 4:
                    continue
                try:
                    org = cells[1].get_text(strip=True)
                    nit_no = cells[2].get_text(strip=True)
                    title_cell = cells[3]
                    title = title_cell.get_text(strip=True)
                    last_date = cells[4].get_text(strip=True) if len(cells) > 4 else ""

                    if not self._row_matches_ministry(org, title):
                        continue

                    link = title_cell.find("a")
                    detail_url = self.NIC_ACTIVE_URL
                    if link and link.get("href"):
                        href = link["href"]
                        detail_url = (
                            href if href.startswith("http")
                            else f"{self.NIC_BASE}{href}"
                        )

                    results.append({
                        "title": title or f"{self.MINISTRY_NAME} Tender {nit_no}",
                        "ministry": self.MINISTRY_NAME,
                        "department": org,
                        "organisation": org,
                        "state": self._infer_state(org),
                        "estimated_cost_lakhs": None,
                        "emd_lakhs": None,
                        "tender_fee": None,
                        "categories": self._infer_categories(title),
                        "procurement_method": "open",
                        "status": "active",
                        "published_at": datetime.utcnow().isoformat(),
                        "submission_deadline": self._parse_closing_date(last_date),
                        "source_nit_no": nit_no,
                        "source_detail_url": detail_url,
                    })
                except Exception:
                    continue

        except httpx.TimeoutException:
            self.log_warning(f"{self.source_id}: timeout on NIC eProcure page", page=page_no)
        except Exception as e:
            self.log_error(f"{self.source_id}: scrape error", error=str(e))

        return results

    def _infer_categories(self, title: str) -> list[str]:
        t = title.lower()
        cats = []
        if any(k in t for k in ["software", "ict", "digital", "it ", "data center", "computer"]):
            cats.append("IT & Software")
        if any(k in t for k in ["construction", "civil", "road", "bridge", "building", "works"]):
            cats.append("Civil & Construction")
        if any(k in t for k in ["medical", "health", "hospital", "medicine", "equipment"]):
            cats.append("Healthcare")
        if any(k in t for k in ["defence", "army", "security", "weapon", "surveillance"]):
            cats.append("Defence")
        if any(k in t for k in ["supply", "purchase", "goods", "procure"]):
            cats.append("Goods & Services")
        if any(k in t for k in ["consult", "service", "advisory", "manpower"]):
            cats.append("Consultancy & Professional Services")
        return cats or ["General"]

    # Also check the ministry's own portal (PORTAL_URL) if set
    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        """Optionally check the ministry's own tender page. Override in subclass."""
        return []

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """
        Fetch ministry-filtered tenders from NIC eProcure.
        Yields 0 results when portal is inaccessible — never returns fixture data.
        """
        self.log_info(
            f"{self.source_id}: starting ministry-filtered NIC eProcure scrape",
            ministry=self.MINISTRY_NAME,
        )
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
        ) as client:
            # Also check ministry's own portal
            own_portal_tenders = await self._try_ministry_portal(client)
            for i, raw in enumerate(own_portal_tenders):
                tid = raw.get("source_nit_no") or f"{self.source_id.upper()}-OWN-{i}"
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=tid,
                    source_url=raw.get("source_detail_url", self.PORTAL_URL),
                    raw_json=raw,
                )
                yielded += 1

            # NIC eProcure pages (filtered by ministry keywords)
            for page_no in range(1, 4):
                rows = await self._scrape_nic_page(client, page_no)
                if not rows:
                    break
                for raw in rows:
                    tid = raw.get("source_nit_no") or f"{self.source_id.upper()}-NIC-{yielded}"
                    yield RawTender(
                        source_id=self.source_id,
                        source_tender_id=tid,
                        source_url=raw.get("source_detail_url", self.NIC_ACTIVE_URL),
                        raw_json=raw,
                    )
                    yielded += 1
                await asyncio.sleep(1.0)

        self.log_info(f"{self.source_id}: crawl complete", ministry=self.MINISTRY_NAME, total=yielded)

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(
                    self.NIC_ACTIVE_URL,
                    headers={"User-Agent": self.HEADERS["User-Agent"]},
                )
                if resp.status_code == 200:
                    return HealthStatus.HEALTHY
                return HealthStatus.FAILED
        except Exception:
            return HealthStatus.FAILED
