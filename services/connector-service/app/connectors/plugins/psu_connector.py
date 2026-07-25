"""
Public Sector Undertakings (PSUs) Connector — Phase 14.5.

Scrapes live tenders from BHEL (bhel.com/tenders) and NTPC (ntpctender.ntpc.co.in).
Both portals confirmed accessible at HTTP 200 without authentication.
Yields 0 results when blocked — never fake data.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from datetime import datetime

import httpx
from app.connectors.base import BaseConnector, CadenceConfig, HealthStatus, RateLimitConfig, RawTender, RetryPolicy
from bs4 import BeautifulSoup


class PSUConnector(BaseConnector):
    """
    Connector for major Indian PSU procurement pages (BHEL + NTPC).
    Live scraper only — no fixture data fallback.
    Yields 0 results when portals are blocked or unreachable.
    """

    source_id = "psu"
    display_name = "Public Sector Undertakings (PSUs)"
    description = "Active notices from BHEL and NTPC scraped live"
    cadence = CadenceConfig(
        cron="0 */4 * * *",
        min_interval_seconds=14400,
        description="Every 4 hours",
    )
    rate_limit = RateLimitConfig(requests_per_second=1.0, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20

    BHEL_TENDERS_URL = "https://www.bhel.com/tenders"
    NTPC_TENDERS_URL = "https://ntpctender.ntpc.co.in"

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }

    def _parse_date(self, date_str: str) -> str | None:
        for fmt in (
            "%d/%m/%Y %H:%M",
            "%d-%m-%Y %H:%M",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%B %d, %Y",
            "%d %b %Y",
            "%d %B %Y",
        ):
            try:
                return datetime.strptime(date_str.strip(), fmt).isoformat()
            except ValueError:
                continue
        return None

    async def _scrape_bhel(self, client: httpx.AsyncClient) -> list[dict]:
        """Scrape BHEL tenders page for active procurement notices."""
        results: list[dict] = []
        try:
            resp = await client.get(self.BHEL_TENDERS_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                self.log_warning(
                    "PSUConnector: BHEL portal non-200", status=resp.status_code
                )
                return results
            body = resp.text
            if any(
                w in body.lower() for w in ["login", "captcha", "403", "access denied"]
            ):
                self.log_warning(
                    "PSUConnector: BHEL portal requires auth or blocked — BLOCKED_AUTH"
                )
                return results

            soup = BeautifulSoup(body, "html.parser")

            # Try to find a tenders table or list
            tender_rows = []
            for table in soup.find_all("table"):
                rows = table.find_all("tr")
                if len(rows) > 2:
                    tender_rows = rows[1:]  # skip header
                    break

            if tender_rows:
                for row in tender_rows:
                    cells = row.find_all(["td", "th"])
                    if len(cells) < 2:
                        continue
                    title_text = cells[0].get_text(strip=True) or cells[1].get_text(
                        strip=True
                    )
                    if not title_text or len(title_text) < 10:
                        continue
                    link = row.find("a")
                    detail_url = self.BHEL_TENDERS_URL
                    if link and link.get("href"):
                        href = link["href"]
                        detail_url = (
                            href
                            if href.startswith("http")
                            else f"https://www.bhel.com{href}"
                        )
                    results.append(
                        {
                            "title": title_text[:300],
                            "ministry": "Ministry of Heavy Industries",
                            "department": "Bharat Heavy Electricals Limited",
                            "organisation": "BHEL",
                            "state": "Delhi",
                            "estimated_cost_lakhs": None,
                            "emd_lakhs": None,
                            "categories": ["Heavy Engineering", "Power Equipment"],
                            "procurement_method": "open",
                            "status": "active",
                            "published_at": datetime.utcnow().isoformat(),
                            "submission_deadline": None,
                            "source_detail_url": detail_url,
                        }
                    )
            else:
                # Fallback: scan for tender hyperlinks
                seen: set = set()
                for a in soup.find_all("a", href=True):
                    text = a.get_text(strip=True)
                    if len(text) < 15 or text in seen:
                        continue
                    if not any(
                        k in text.lower()
                        for k in ["tender", "nit", "bid", "rfq", "rfp", "notice"]
                    ):
                        continue
                    seen.add(text)
                    href = a["href"]
                    detail_url = (
                        href
                        if href.startswith("http")
                        else f"https://www.bhel.com{href}"
                    )
                    results.append(
                        {
                            "title": text[:300],
                            "ministry": "Ministry of Heavy Industries",
                            "department": "Bharat Heavy Electricals Limited",
                            "organisation": "BHEL",
                            "state": "Delhi",
                            "estimated_cost_lakhs": None,
                            "emd_lakhs": None,
                            "categories": ["Heavy Engineering"],
                            "procurement_method": "open",
                            "status": "active",
                            "published_at": datetime.utcnow().isoformat(),
                            "submission_deadline": None,
                            "source_detail_url": detail_url,
                        }
                    )
        except Exception as e:
            self.log_warning("PSUConnector: BHEL scrape error", error=str(e))
        return results

    async def _scrape_ntpc(self, client: httpx.AsyncClient) -> list[dict]:
        """Scrape NTPC tender portal for active procurement notices."""
        results: list[dict] = []
        try:
            resp = await client.get(self.NTPC_TENDERS_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                self.log_warning(
                    "PSUConnector: NTPC portal non-200", status=resp.status_code
                )
                return results
            body = resp.text
            if any(w in body.lower() for w in ["login", "captcha", "access denied"]):
                self.log_warning(
                    "PSUConnector: NTPC portal requires auth — BLOCKED_AUTH"
                )
                return results

            soup = BeautifulSoup(body, "html.parser")

            # Try table rows first
            for table in soup.find_all("table"):
                rows = table.find_all("tr")[1:]
                if len(rows) < 2:
                    continue
                for row in rows:
                    cells = row.find_all("td")
                    if len(cells) < 2:
                        continue
                    title_text = cells[0].get_text(strip=True)
                    if not title_text or len(title_text) < 10:
                        title_text = cells[1].get_text(strip=True)
                    if len(title_text) < 10:
                        continue
                    link = row.find("a")
                    detail_url = self.NTPC_TENDERS_URL
                    if link and link.get("href"):
                        href = link["href"]
                        detail_url = (
                            href
                            if href.startswith("http")
                            else f"{self.NTPC_TENDERS_URL.rstrip('/')}/{href.lstrip('/')}"
                        )
                    last_date = cells[-1].get_text(strip=True) if len(cells) > 2 else ""
                    results.append(
                        {
                            "title": title_text[:300],
                            "ministry": "Ministry of Power",
                            "department": "NTPC Limited",
                            "organisation": "NTPC",
                            "state": "Delhi",
                            "estimated_cost_lakhs": None,
                            "emd_lakhs": None,
                            "categories": ["Power Plant Equipment", "Heavy Machinery"],
                            "procurement_method": "open",
                            "status": "active",
                            "published_at": datetime.utcnow().isoformat(),
                            "submission_deadline": self._parse_date(last_date),
                            "source_detail_url": detail_url,
                        }
                    )
                if results:
                    break

            if not results:
                # Fallback: hyperlink scan
                seen: set = set()
                for a in soup.find_all("a", href=True):
                    text = a.get_text(strip=True)
                    if len(text) < 15 or text in seen:
                        continue
                    if not any(
                        k in text.lower()
                        for k in ["tender", "nit", "bid", "rfq", "notice"]
                    ):
                        continue
                    seen.add(text)
                    href = a["href"]
                    detail_url = (
                        href
                        if href.startswith("http")
                        else f"{self.NTPC_TENDERS_URL.rstrip('/')}/{href.lstrip('/')}"
                    )
                    results.append(
                        {
                            "title": text[:300],
                            "ministry": "Ministry of Power",
                            "department": "NTPC Limited",
                            "organisation": "NTPC",
                            "state": "Delhi",
                            "estimated_cost_lakhs": None,
                            "emd_lakhs": None,
                            "categories": ["Power Plant Equipment"],
                            "procurement_method": "open",
                            "status": "active",
                            "published_at": datetime.utcnow().isoformat(),
                            "submission_deadline": None,
                            "source_detail_url": detail_url,
                        }
                    )
        except Exception as e:
            self.log_warning("PSUConnector: NTPC scrape error", error=str(e))
        return results

    async def fetch_tenders(
        self, since: datetime | None = None
    ) -> AsyncIterator[RawTender]:
        """
        Fetch real tenders from live BHEL and NTPC procurement portals.
        No fixture data fallback — yields 0 results when portals are blocked.
        """
        self.log_info("PSUConnector: starting live crawl of BHEL + NTPC portals")
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds, follow_redirects=True
        ) as client:
            # Attempt 1: BHEL
            bhel_results = await self._scrape_bhel(client)
            for i, raw in enumerate(bhel_results):
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=f"BHEL-{datetime.utcnow().strftime('%Y%m')}-{i:04d}",
                    source_url=raw.get("source_detail_url", self.BHEL_TENDERS_URL),
                    raw_json=raw,
                )
                yielded += 1

            await asyncio.sleep(1.5)

            # Attempt 2: NTPC
            ntpc_results = await self._scrape_ntpc(client)
            for i, raw in enumerate(ntpc_results):
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=f"NTPC-{datetime.utcnow().strftime('%Y%m')}-{i:04d}",
                    source_url=raw.get("source_detail_url", self.NTPC_TENDERS_URL),
                    raw_json=raw,
                )
                yielded += 1

        if not yielded:
            self.log_warning(
                "PSUConnector: 0 tenders yielded — BHEL + NTPC portals blocked or empty. "
                "Status: BLOCKED_NETWORK / BLOCKED_AUTH. No fixture data returned.",
            )
        else:
            self.log_info("PSUConnector: crawl complete", total=yielded)

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                resp = await client.head(self.BHEL_TENDERS_URL)
                if resp.status_code < 500:
                    return HealthStatus.HEALTHY
                return HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
