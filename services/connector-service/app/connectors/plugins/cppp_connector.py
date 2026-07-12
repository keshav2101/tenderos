"""
CPPP (Central Public Procurement Portal) Connector — Phase 14.5.

Scrapes live active tenders from NIC e-Procurement portal.
The RSS feed (eprocure.gov.in/cppp/latestactive/xml) returned HTTP 404 — it is dead.
This connector uses HTML scraping of the active tenders listing page instead.

Access pattern:
  GET /eprocure/app?page=FrontEndLatestActiveTenders&service=page
  → paginates via form POST with page offsets

When the portal is unreachable or returns a login gate, the connector
yields 0 results and logs BLOCKED_NETWORK rather than returning fixture data.
"""
from __future__ import annotations

import asyncio
import re
from datetime import datetime, timedelta
from typing import AsyncIterator, Optional

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class CPPPConnector(BaseConnector):
    """
    Connector for Central Public Procurement Portal (CPPP).
    Scrapes the NIC eProcure active tenders listing page.
    Yields 0 results (never fixture data) when portal is inaccessible.
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

    PORTAL_BASE = "https://eprocure.gov.in/eprocure/app"
    ACTIVE_TENDERS_PAGE = (
        "https://eprocure.gov.in/eprocure/app"
        "?page=FrontEndLatestActiveTenders&service=page"
    )
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Referer": "https://eprocure.gov.in/eprocure/app",
    }

    def _parse_tenders_table(self, html: str, source_url: str) -> list[dict]:
        """Parse the active tenders HTML table from CPPP / NIC eProcure."""
        soup = BeautifulSoup(html, "html.parser")
        results = []

        # NIC eProcure uses a table with id="loadedDataTable" or class="list_table"
        table = (
            soup.find("table", {"id": "loadedDataTable"})
            or soup.find("table", {"class": "list_table"})
            or soup.find("table", {"class": "tablebg"})
        )
        if not table:
            return results

        rows = table.find_all("tr")
        for row in rows[1:]:  # skip header
            cells = row.find_all("td")
            if len(cells) < 5:
                continue
            try:
                # Typical NIC eProcure columns:
                # 0: S.No | 1: Organisation | 2: NIT No | 3: Title/Work | 4: Last Date
                organisation = cells[1].get_text(strip=True)
                nit_no = cells[2].get_text(strip=True)
                title_cell = cells[3]
                title = title_cell.get_text(strip=True)

                # Extract detail link if present
                link_tag = title_cell.find("a")
                detail_url = source_url
                if link_tag and link_tag.get("href"):
                    href = link_tag["href"]
                    if href.startswith("http"):
                        detail_url = href
                    else:
                        detail_url = f"https://eprocure.gov.in{href}"

                # Last date
                last_date_str = cells[4].get_text(strip=True) if len(cells) > 4 else ""
                submission_deadline = None
                for fmt in ("%d/%m/%Y %H:%M", "%d-%m-%Y %H:%M", "%d/%m/%Y", "%d-%m-%Y"):
                    try:
                        submission_deadline = datetime.strptime(last_date_str, fmt).isoformat()
                        break
                    except ValueError:
                        continue
                if not submission_deadline:
                    submission_deadline = (datetime.utcnow() + timedelta(days=14)).isoformat()

                # Ministry/state from organisation name heuristic
                state = self._infer_state(organisation)
                ministry = self._infer_ministry(organisation)

                results.append({
                    "title": title or f"CPPP Tender {nit_no}",
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
                    "published_at": datetime.utcnow().isoformat(),
                    "submission_deadline": submission_deadline,
                    "source_nit_no": nit_no,
                    "source_detail_url": detail_url,
                })
            except Exception as parse_err:
                self.log_warning("CPPP: row parse error", error=str(parse_err))
                continue

        return results

    def _infer_state(self, org: str) -> str:
        state_keywords = {
            "Maharashtra": "Maharashtra", "Delhi": "Delhi", "Karnataka": "Karnataka",
            "Tamil Nadu": "Tamil Nadu", "Uttar Pradesh": "Uttar Pradesh",
            "Gujarat": "Gujarat", "Rajasthan": "Rajasthan", "Madhya Pradesh": "Madhya Pradesh",
            "West Bengal": "West Bengal", "Punjab": "Punjab", "Haryana": "Haryana",
            "Bihar": "Bihar", "Odisha": "Odisha", "Telangana": "Telangana",
            "Kerala": "Kerala", "Assam": "Assam", "Jharkhand": "Jharkhand",
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
        if any(k in org_lower for k in ["defence", "army", "navy", "air force", "drdo"]):
            return "Ministry of Defence"
        if any(k in org_lower for k in ["education", "school", "university", "iit", "nit"]):
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
        if any(k in title_lower for k in ["software", "it ", "ict", "digital", "computer", "data"]):
            cats.append("IT & Software")
        if any(k in title_lower for k in ["construction", "civil", "road", "bridge", "building"]):
            cats.append("Civil & Construction")
        if any(k in title_lower for k in ["medical", "health", "hospital", "equipment"]):
            cats.append("Healthcare")
        if any(k in title_lower for k in ["supply", "purchase", "procure"]):
            cats.append("Goods & Services")
        if any(k in title_lower for k in ["consult", "service", "advisory"]):
            cats.append("Consultancy & Professional Services")
        return cats or ["General"]

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """
        Scrape active tenders from NIC eProcure CPPP listing.
        Yields 0 results if portal is blocked — never returns fixture data.
        """
        self.log_info("CPPPConnector: starting live NIC eProcure scrape", since=since)
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            headers=self.HEADERS,
        ) as client:
            for page_no in range(1, 6):  # Up to 5 pages (≈100 tenders per crawl)
                try:
                    if page_no == 1:
                        resp = await client.get(self.ACTIVE_TENDERS_PAGE)
                    else:
                        # NIC eProcure paginates via POST with page index
                        resp = await client.post(
                            self.PORTAL_BASE,
                            data={
                                "page": "FrontEndLatestActiveTenders",
                                "service": "page",
                                "pageIndex": str(page_no),
                            },
                        )

                    if resp.status_code != 200:
                        self.log_warning(
                            "CPPPConnector: non-200 response",
                            status=resp.status_code, page=page_no,
                        )
                        break

                    body = resp.text
                    # Detect login/CAPTCHA gate
                    if any(w in body.lower() for w in ["login", "captcha", "session expired", "otp"]):
                        self.log_warning(
                            "CPPPConnector: login/captcha gate detected — "
                            "BLOCKED_NETWORK. Yielding 0 results.",
                            page=page_no,
                        )
                        break

                    tenders = self._parse_tenders_table(body, resp.url.__str__())
                    if not tenders:
                        self.log_info(
                            "CPPPConnector: no rows parsed on page — stopping pagination",
                            page=page_no,
                        )
                        break

                    for raw in tenders:
                        tender_id = raw.get("source_nit_no") or f"CPPP-P{page_no}-{yielded}"
                        yield RawTender(
                            source_id=self.source_id,
                            source_tender_id=tender_id,
                            source_url=raw.get("source_detail_url", self.ACTIVE_TENDERS_PAGE),
                            raw_json=raw,
                        )
                        yielded += 1

                    await asyncio.sleep(1.0)  # polite delay

                except httpx.TimeoutException:
                    self.log_warning("CPPPConnector: timeout on page", page=page_no)
                    break
                except Exception as err:
                    self.log_error("CPPPConnector: scrape error", error=str(err), page=page_no)
                    break

        self.log_info("CPPPConnector: crawl complete", total=yielded)

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(
                    self.ACTIVE_TENDERS_PAGE,
                    headers={"User-Agent": self.HEADERS["User-Agent"]},
                )
                if resp.status_code == 200 and "tender" in resp.text.lower():
                    return HealthStatus.HEALTHY
                if resp.status_code == 200:
                    return HealthStatus.DEGRADED
                return HealthStatus.FAILED
        except Exception:
            return HealthStatus.FAILED
