"""
CPPP (Central Public Procurement Portal) Connector — Phase 15.

Scrapes live active tenders from NIC e-Procurement portal.
This connector uses HTML scraping of the new active tenders listing page:
  https://eprocure.gov.in/cppp/latestactivetendersnew/cpppdata
Which does not require Captcha or sessions for initial pages.

Never returns fixture data.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import (
    BaseConnector,
    CadenceConfig,
    HealthStatus,
    RateLimitConfig,
    RawTender,
    RetryPolicy,
)


class CPPPConnector(BaseConnector):
    """
    Connector for Central Public Procurement Portal (CPPP).
    Scrapes the CPPP new active tenders list.
    """

    source_id = "cppp"
    display_name = "Central Public Procurement Portal (CPPP)"
    description = "Official CPPP portal — Active Tenders (NIC eProcure)"
    cadence = CadenceConfig(
        cron="*/30 * * * *",
        min_interval_seconds=1800,
        description="Every 30 minutes",
    )
    rate_limit = RateLimitConfig(requests_per_second=1.0, burst=3)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 25

    PORTAL_BASE = "https://eprocure.gov.in/cppp/latestactivetendersnew/cpppdata"
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }

    def _parse_tenders_table(self, html: str, source_url: str) -> list[dict]:
        """Parse CPPP active tenders table."""
        soup = BeautifulSoup(html, "html.parser")
        results = []

        table = soup.find("table")
        if not table:
            return results

        rows = table.find_all("tr")
        for row in rows[1:]:  # skip header
            cells = row.find_all("td")
            if len(cells) < 6:
                continue
            try:
                # Columns:
                # 0: Sl.No | 1: e-Published Date | 2: Bid Closing Date | 3: Opening Date | 4: Title/Ref | 5: Org Name | 6: Corrigendum
                pub_date = cells[1].get_text(strip=True)
                close_date = cells[2].get_text(strip=True)
                opening_date = cells[3].get_text(strip=True)

                title_ref_cell = cells[4]
                title_ref_text = title_ref_cell.get_text("\n", strip=True)
                lines = [l.strip() for l in title_ref_text.split("\n") if l.strip()]

                title = lines[0] if lines else ""
                ref_no = lines[1] if len(lines) > 1 else ""
                tender_id = (
                    lines[2]
                    if len(lines) > 2
                    else (ref_no or cells[0].get_text(strip=True))
                )

                link_tag = title_ref_cell.find("a")
                detail_url = source_url
                if link_tag and link_tag.get("href"):
                    href = link_tag["href"]
                    detail_url = (
                        href
                        if href.startswith("http")
                        else f"https://eprocure.gov.in{href}"
                    )

                organisation = cells[5].get_text(strip=True)

                # Parse dates
                published_at = (
                    self._parse_date(pub_date) or datetime.utcnow().isoformat()
                )
                submission_deadline = (
                    self._parse_date(close_date)
                    or (datetime.utcnow() + timedelta(days=14)).isoformat()
                )
                opening_at = self._parse_date(opening_date)

                # Heuristics for ministry and state
                state = self._infer_state(organisation)
                ministry = self._infer_ministry(organisation)

                results.append(
                    {
                        "title": title,
                        "ministry": ministry,
                        "department": organisation,
                        "organisation": organisation,
                        "state": state,
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
            except Exception as parse_err:
                self.log_warning("CPPP: row parse error", error=str(parse_err))
                continue

        return results

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

    def _infer_state(self, org: str) -> str:
        state_keywords = {
            "Maharashtra": "Maharashtra",
            "Delhi": "Delhi",
            "Karnataka": "Karnataka",
            "Tamil Nadu": "Tamil Nadu",
            "Uttar Pradesh": "Uttar Pradesh",
            "Gujarat": "Gujarat",
            "Rajasthan": "Rajasthan",
            "Madhya Pradesh": "Madhya Pradesh",
            "West Bengal": "West Bengal",
            "Punjab": "Punjab",
            "Haryana": "Haryana",
            "Bihar": "Bihar",
            "Odisha": "Odisha",
            "Telangana": "Telangana",
            "Kerala": "Kerala",
            "Assam": "Assam",
            "Jharkhand": "Jharkhand",
        }
        org_lower = org.lower()
        for state, name in state_keywords.items():
            if state.lower() in org_lower:
                return name
        return "Delhi"

    def _infer_ministry(self, org: str) -> str | None:
        org_lower = org.lower()
        if any(k in org_lower for k in ["health", "hospital", "aiims", "nhm"]):
            return "Ministry of Health and Family Welfare"
        if any(k in org_lower for k in ["railway", "rail"]):
            return "Ministry of Railways"
        if any(
            k in org_lower for k in ["defence", "army", "navy", "air force", "drdo"]
        ):
            return "Ministry of Defence"
        if any(
            k in org_lower for k in ["education", "school", "university", "iit", "nit"]
        ):
            return "Ministry of Education"
        if any(k in org_lower for k in ["road", "highway", "nhai", "morth"]):
            return "Ministry of Road Transport and Highways"
        if any(k in org_lower for k in ["water", "irrigation", "dam"]):
            return "Ministry of Jal Shakti"
        if any(k in org_lower for k in ["power", "energy", "electricity", "ntpc"]):
            return "Ministry of Power"
        return None

    def _infer_categories(self, title: str) -> list[str]:
        title_lower = title.lower()
        cats = []
        if any(
            k in title_lower
            for k in [
                "software",
                "it ",
                "ict",
                "digital",
                "computer",
                "data",
                "cloud",
                "erp",
            ]
        ):
            cats.append("IT & Software")
        if any(
            k in title_lower
            for k in [
                "construction",
                "civil",
                "road",
                "bridge",
                "building",
                "infrastructure",
            ]
        ):
            cats.append("Civil & Construction")
        if any(
            k in title_lower
            for k in ["medical", "health", "hospital", "equipment", "medicine"]
        ):
            cats.append("Healthcare")
        if any(k in title_lower for k in ["supply", "purchase", "procure", "goods"]):
            cats.append("Goods & Services")
        if any(
            k in title_lower
            for k in ["consult", "service", "advisory", "amc", "maintenance"]
        ):
            cats.append("Consultancy & Professional Services")
        return cats or ["General"]

    async def fetch_tenders(
        self, since: datetime | None = None
    ) -> AsyncIterator[RawTender]:
        """
        Scrape active tenders from NIC eProcure CPPP listing.
        """
        self.log_info("CPPPConnector: starting live NIC eProcure scrape", since=since)
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=False,  # nosec B501
            headers=self.HEADERS,
        ) as client:
            for page_no in range(1, 11):  # Fetch 10 pages (≈100 tenders per crawl)
                try:
                    url = f"{self.PORTAL_BASE}?page={page_no}"
                    resp = await client.get(url)

                    if resp.status_code != 200:
                        self.log_warning(
                            "CPPPConnector: non-200 response",
                            status=resp.status_code,
                            page=page_no,
                        )
                        break

                    body = resp.text
                    tenders = self._parse_tenders_table(body, url)
                    if not tenders:
                        self.log_info(
                            "CPPPConnector: no rows parsed on page — stopping pagination",
                            page=page_no,
                        )
                        break

                    for raw in tenders:
                        tender_id = (
                            raw.get("source_nit_no") or f"CPPP-P{page_no}-{yielded}"
                        )
                        yield RawTender(
                            source_id=self.source_id,
                            source_tender_id=tender_id,
                            source_url=raw.get("source_detail_url", url),
                            raw_json=raw,
                        )
                        yielded += 1

                    await asyncio.sleep(1.0)  # polite delay

                except httpx.TimeoutException:
                    self.log_warning("CPPPConnector: timeout on page", page=page_no)
                    break
                except Exception as err:
                    self.log_error(
                        "CPPPConnector: scrape error", error=str(err), page=page_no
                    )
                    break

        self.log_info("CPPPConnector: crawl complete", total=yielded)

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(
                timeout=10.0, follow_redirects=True, verify=False
            ) as client:  # nosec B501
                resp = await client.get(
                    self.PORTAL_BASE,
                    headers={"User-Agent": self.HEADERS["User-Agent"]},
                )
                if resp.status_code == 200 and "tender" in resp.text.lower():
                    return HealthStatus.HEALTHY
                if resp.status_code == 200:
                    return HealthStatus.DEGRADED
                return HealthStatus.FAILED
        except Exception:
            return HealthStatus.FAILED
