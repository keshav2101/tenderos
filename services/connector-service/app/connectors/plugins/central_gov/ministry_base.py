"""
Ministry-Filtered NIC eProcure Connector Base — Phase 15.

All central ministry connectors extend this base.
Strategy:
  1. Scrape the new un-captcha-gated CPPP Latest Active Tenders page
  2. Filter rows by ministry-specific keywords
  3. Yield only real scraped tenders — no fixture data fallback
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import BaseConnector, CadenceConfig, HealthStatus, RateLimitConfig, RawTender, RetryPolicy


class MinistryBaseConnector(BaseConnector):
    """
    Abstract base for ministry-specific NIC eProcure connectors.
    Subclasses set: source_id, display_name, MINISTRY_NAME, MINISTRY_KEYWORDS, PORTAL_URL.
    Never returns fixture data — yields 0 results when blocked.
    """

    MINISTRY_NAME: str = "Central Government"
    MINISTRY_KEYWORDS: list[str] = []
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

    CPPP_URL = "https://eprocure.gov.in/cppp/latestactivetendersnew/cpppdata"
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
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

    def _parse_date(self, s: str) -> str | None:
        if not s or s == "--":
            return None
        s = s.strip()
        for fmt in (
            "%d-%b-%Y %I:%M %p",
            "%d-%b-%Y %H:%M",
            "%d-%b-%Y",
            "%d/%m/%Y %H:%M",
            "%d-%m-%Y %H:%M",
            "%d/%m/%Y",
            "%d-%m-%Y",
        ):
            try:
                return datetime.strptime(s, fmt).isoformat()
            except ValueError:
                continue
        return None

    def _infer_categories(self, title: str) -> list[str]:
        t = title.lower()
        cats = []
        if any(
            k in t
            for k in [
                "software",
                "ict",
                "digital",
                "it ",
                "data center",
                "computer",
                "cloud",
                "erp",
            ]
        ):
            cats.append("IT & Software")
        if any(
            k in t
            for k in [
                "construction",
                "civil",
                "road",
                "bridge",
                "building",
                "works",
                "infrastructure",
            ]
        ):
            cats.append("Civil & Construction")
        if any(k in t for k in ["medical", "health", "hospital", "medicine", "equipment"]):
            cats.append("Healthcare")
        if any(k in t for k in ["defence", "army", "security", "weapon", "surveillance"]):
            cats.append("Defence")
        if any(k in t for k in ["supply", "purchase", "goods", "procure"]):
            cats.append("Goods & Services")
        if any(k in t for k in ["consult", "service", "advisory", "manpower", "maintenance"]):
            cats.append("Consultancy & Professional Services")
        return cats or ["General"]

    async def _scrape_cppp_page(self, client: httpx.AsyncClient, page_no: int) -> list[dict]:
        """Fetch and parse one CPPP active page, filtering by ministry."""
        results = []
        try:
            url = f"{self.CPPP_URL}?page={page_no}"
            resp = await client.get(url, headers=self.HEADERS)
            if resp.status_code != 200:
                return results

            soup = BeautifulSoup(resp.text, "html.parser")
            table = soup.find("table")
            if not table:
                return results

            rows = table.find_all("tr")
            for row in rows[1:]:  # skip header
                cells = row.find_all("td")
                if len(cells) < 6:
                    continue
                try:
                    pub_date = cells[1].get_text(strip=True)
                    close_date = cells[2].get_text(strip=True)
                    opening_date = cells[3].get_text(strip=True)

                    title_ref_cell = cells[4]
                    title_ref_text = title_ref_cell.get_text("\n", strip=True)
                    lines = [l.strip() for l in title_ref_text.split("\n") if l.strip()]

                    title = lines[0] if lines else ""
                    ref_no = lines[1] if len(lines) > 1 else ""
                    tender_id = lines[2] if len(lines) > 2 else (ref_no or cells[0].get_text(strip=True))

                    link_tag = title_ref_cell.find("a")
                    detail_url = url
                    if link_tag and link_tag.get("href"):
                        href = link_tag["href"]
                        detail_url = href if href.startswith("http") else f"https://eprocure.gov.in{href}"

                    organisation = cells[5].get_text(strip=True)

                    if not self._row_matches_ministry(organisation, title):
                        continue

                    published_at = self._parse_date(pub_date) or datetime.utcnow().isoformat()
                    submission_deadline = (
                        self._parse_date(close_date) or (datetime.utcnow() + timedelta(days=14)).isoformat()
                    )
                    opening_at = self._parse_date(opening_date)

                    results.append(
                        {
                            "title": title,
                            "ministry": self.MINISTRY_NAME,
                            "department": organisation,
                            "organisation": organisation,
                            "state": self.MINISTRY_STATE,
                            "estimated_cost_lakhs": None,
                            "emd_lakhs": None,
                            "tender_fee": None,
                            "categories": self._infer_categories(title),
                            "procurement_method": "open",
                            "status": "active",
                            "published_at": published_at,
                            "submission_deadline": submission_deadline,
                            "opening_date": opening_at,
                            "source_nit_no": ref_no or tender_id,
                            "source_detail_url": detail_url,
                        }
                    )
                except Exception:
                    continue

        except httpx.TimeoutException:
            self.log_warning(f"{self.source_id}: timeout on CPPP active tenders page", page=page_no)
        except Exception as e:
            self.log_error(f"{self.source_id}: scrape error", error=str(e))

        return results

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        """Optionally check the ministry's own tender page. Override in subclass."""
        return []

    async def fetch_tenders(self, since: datetime | None = None) -> AsyncIterator[RawTender]:
        """
        Fetch ministry-filtered tenders from CPPP.
        """
        self.log_info(
            f"{self.source_id}: starting ministry-filtered CPPP scrape",
            ministry=self.MINISTRY_NAME,
        )
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=False,  # nosec B501
        ) as client:
            # Check ministry's own portal first
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

            # Scrape and filter CPPP active pages (pages 1 to 10)
            for page_no in range(1, 11):
                rows = await self._scrape_cppp_page(client, page_no)
                for raw in rows:
                    tid = raw.get("source_nit_no") or f"{self.source_id.upper()}-NIC-{yielded}"
                    yield RawTender(
                        source_id=self.source_id,
                        source_tender_id=tid,
                        source_url=raw.get("source_detail_url", self.CPPP_URL),
                        raw_json=raw,
                    )
                    yielded += 1
                await asyncio.sleep(1.0)

        self.log_info(
            f"{self.source_id}: crawl complete",
            ministry=self.MINISTRY_NAME,
            total=yielded,
        )

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:  # nosec B501
                resp = await client.get(
                    self.CPPP_URL,
                    headers={"User-Agent": self.HEADERS["User-Agent"]},
                )
                if resp.status_code == 200:
                    return HealthStatus.HEALTHY
                return HealthStatus.FAILED
        except Exception:
            return HealthStatus.FAILED
