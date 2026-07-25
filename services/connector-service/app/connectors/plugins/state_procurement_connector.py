"""
State Government eProcurement Connector — Phase 14.5.

Scrapes live tenders from Maharashtra Tenders portal and NIC eProcure filtered
for Maharashtra and Uttar Pradesh. Yields 0 results when blocked — never fake data.
"""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import AsyncIterator, List, Optional

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class StateProcurementConnector(BaseConnector):
    """
    Connector for Maharashtra + UP state eProcurement portals.
    Live scraper only — no fixture data fallback.
    Yields 0 results when all portals are blocked or unreachable.
    """
    source_id = "maharashtra"
    display_name = "Maharashtra Tenders"
    description = "Active notices from Maharashtra and UP state portals via live scraping"
    cadence = CadenceConfig(
        cron="0 */4 * * *",
        min_interval_seconds=10800,
        description="Every 4 hours",
    )
    rate_limit = RateLimitConfig(requests_per_second=1.0, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20

    MAHA_EPROCURE_URL = "https://mahatenders.gov.in"
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

    TARGET_STATE_KEYWORDS = [
        "maharashtra", "uttar pradesh", "up ", "pune", "mumbai", "nagpur", "lucknow",
    ]

    def _is_target_state(self, text: str) -> bool:
        t = text.lower()
        return any(s in t for s in self.TARGET_STATE_KEYWORDS)

    def _parse_date(self, date_str: str) -> Optional[str]:
        for fmt in ("%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(date_str.strip(), fmt).isoformat()
            except ValueError:
                continue
        return None

    async def _scrape_maha_portal(self, client: httpx.AsyncClient) -> List[dict]:
        """Scrape Maharashtra Tenders portal for tender hyperlinks."""
        results: List[dict] = []
        try:
            resp = await client.get(self.MAHA_EPROCURE_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                return results
            body = resp.text
            if any(w in body.lower() for w in ["login", "captcha", "j_username", "otp"]):
                self.log_info(
                    "StateProcurementConnector: Maharashtra portal requires auth — BLOCKED_AUTH",
                    portal=self.MAHA_EPROCURE_URL,
                )
                return results

            soup = BeautifulSoup(body, "html.parser")
            seen: set = set()
            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True)
                if len(text) < 15 or text in seen:
                    continue
                href = a["href"]
                if not any(k in text.lower() for k in ["tender", "nit", "bid", "rfp", "notice", "quotation"]):
                    continue
                seen.add(text)
                full_url = (
                    href if href.startswith("http")
                    else f"https://mahatenders.gov.in/{href.lstrip('/')}"
                )
                results.append({
                    "title": text[:300],
                    "ministry": "Government of Maharashtra",
                    "department": "Maharashtra Government",
                    "organisation": "Maharashtra Government",
                    "state": "Maharashtra",
                    "estimated_cost_lakhs": None,
                    "emd_lakhs": None,
                    "categories": ["General"],
                    "procurement_method": "open",
                    "status": "active",
                    "published_at": datetime.utcnow().isoformat(),
                    "submission_deadline": None,
                    "source_nit_no": None,
                    "source_detail_url": full_url,
                })
        except Exception as e:
            self.log_warning("StateProcurementConnector: Maharashtra portal scrape error", error=str(e))
        return results

    async def _scrape_nic_eprocure(self, client: httpx.AsyncClient) -> List[dict]:
        """Scrape NIC eProcure active tenders and filter for Maharashtra/UP rows."""
        results: List[dict] = []
        try:
            resp = await client.get(self.NIC_ACTIVE_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                self.log_warning("StateProcurementConnector: NIC eProcure non-200", status=resp.status_code)
                return results
            body = resp.text
            if any(w in body.lower() for w in ["login", "captcha", "j_username"]):
                self.log_warning("StateProcurementConnector: NIC eProcure requires login — BLOCKED_AUTH")
                return results

            soup = BeautifulSoup(body, "html.parser")
            table = (
                soup.find("table", {"id": "loadedDataTable"})
                or soup.find("table", {"class": "list_table"})
                or soup.find("table", {"class": "tablebg"})
            )
            if not table:
                self.log_info("StateProcurementConnector: NIC eProcure — no tender table found")
                return results

            for row in table.find_all("tr")[1:]:
                cells = row.find_all("td")
                if len(cells) < 4:
                    continue
                org = cells[1].get_text(strip=True)
                nit_no = cells[2].get_text(strip=True)
                title = cells[3].get_text(strip=True)
                last_date = cells[4].get_text(strip=True) if len(cells) > 4 else ""

                if not self._is_target_state(org + " " + title):
                    continue

                link = cells[3].find("a")
                detail_url = self.NIC_ACTIVE_URL
                if link and link.get("href"):
                    href = link["href"]
                    detail_url = href if href.startswith("http") else f"{self.NIC_BASE}{href}"

                state = "Maharashtra" if "maharashtra" in (org + title).lower() else "Uttar Pradesh"
                results.append({
                    "title": title or f"{state} Tender {nit_no}",
                    "ministry": f"Government of {state}",
                    "department": org,
                    "organisation": org,
                    "state": state,
                    "estimated_cost_lakhs": None,
                    "emd_lakhs": None,
                    "categories": ["General"],
                    "procurement_method": "open",
                    "status": "active",
                    "published_at": datetime.utcnow().isoformat(),
                    "submission_deadline": self._parse_date(last_date),
                    "source_nit_no": nit_no,
                    "source_detail_url": detail_url,
                })
        except Exception as e:
            self.log_warning("StateProcurementConnector: NIC eProcure scrape error", error=str(e))
        return results

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """
        Fetch real tenders from live Maharashtra and UP state procurement portals.
        No fixture data fallback — yields 0 results when all sources are blocked.
        """
        self.log_info("StateProcurementConnector: starting live crawl of Maharashtra + UP portals")
        yielded = 0

        async with httpx.AsyncClient(timeout=self.timeout_seconds, follow_redirects=True) as client:
            # Attempt 1: Maharashtra Tenders portal (link extraction)
            maha_results = await self._scrape_maha_portal(client)
            for i, raw in enumerate(maha_results):
                tid = raw.get("source_nit_no") or f"MAHA-OWN-{i}"
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=tid,
                    source_url=raw.get("source_detail_url", self.MAHA_EPROCURE_URL),
                    raw_json=raw,
                )
                yielded += 1

            await asyncio.sleep(1.0)

            # Attempt 2: NIC eProcure filtered for Maharashtra/UP
            nic_results = await self._scrape_nic_eprocure(client)
            for i, raw in enumerate(nic_results):
                tid = raw.get("source_nit_no") or f"MAHA-NIC-{i}"
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=tid,
                    source_url=raw.get("source_detail_url", self.NIC_ACTIVE_URL),
                    raw_json=raw,
                )
                yielded += 1

        if not yielded:
            self.log_warning(
                "StateProcurementConnector: 0 tenders yielded — all sources blocked. "
                "Status: BLOCKED_NETWORK / BLOCKED_AUTH. No fixture data returned.",
            )
        else:
            self.log_info("StateProcurementConnector: crawl complete", total=yielded)

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                resp = await client.head(self.MAHA_EPROCURE_URL)
                if resp.status_code < 500:
                    return HealthStatus.HEALTHY
                return HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
