"""
PSU Connector Base — Phase 14.5.

All PSU-specific connectors extend PSUBaseConnector.
Each PSU has its own tender portal URL — this base scrapes it directly
with BeautifulSoup link extraction as a first pass, then also checks
the NIC eProcure active tenders page filtered by PSU name keywords.

Never returns fixture data. Yields 0 results when blocked.
"""
from __future__ import annotations

import asyncio
import re
from datetime import datetime, timedelta
from typing import AsyncIterator, List, Dict, Any, Optional

import httpx
from bs4 import BeautifulSoup

from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class PSUBaseConnector(BaseConnector):
    """Base for all PSU procurement connectors. No fixture data."""
    PSU_NAME: str = ""
    PSU_KEYWORDS: List[str] = []
    TENDER_URL: str = ""
    TENDER_URL_ALT: List[str] = []  # alternate URLs to try
    MINISTRY: str = ""
    STATE: str = "Delhi"

    cadence = CadenceConfig(
        cron="0 */4 * * *",
        min_interval_seconds=14400,
        description="Every 4 hours",
    )
    rate_limit = RateLimitConfig(requests_per_second=0.5, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }

    NIC_URL = (
        "https://eprocure.gov.in/eprocure/app"
        "?page=FrontEndLatestActiveTenders&service=page"
    )
    NIC_BASE = "https://eprocure.gov.in"

    def _is_login_gated(self, body: str) -> bool:
        return any(k in body.lower() for k in ["login", "captcha", "j_username", "otp", "password"])

    def _parse_date(self, s: str) -> Optional[str]:
        for fmt in ("%d/%m/%Y %H:%M", "%d-%m-%Y", "%d/%m/%Y", "%B %d, %Y", "%d %b %Y"):
            try:
                return datetime.strptime(s.strip(), fmt).isoformat()
            except ValueError:
                continue
        return None

    def _infer_categories(self, title: str) -> List[str]:
        t = title.lower()
        cats = []
        if any(k in t for k in ["software", "it ", "digital", "ict", "erp", "sap"]):
            cats.append("IT & Software")
        if any(k in t for k in ["civil", "construction", "plant", "infrastructure"]):
            cats.append("Civil & Construction")
        if any(k in t for k in ["equipment", "machinery", "supply"]):
            cats.append("Equipment & Machinery")
        if any(k in t for k in ["service", "annual", "contract", "amc"]):
            cats.append("Contracts & Services")
        if any(k in t for k in ["consult", "study", "advisory"]):
            cats.append("Consultancy & Professional Services")
        return cats or ["General"]

    async def _scrape_portal(self, client: httpx.AsyncClient, url: str) -> List[Dict[str, Any]]:
        """Scrape a PSU tender page — link extraction + table parsing."""
        results = []
        try:
            resp = await client.get(url, headers=self.HEADERS)
            if resp.status_code != 200:
                self.log_info(f"{self.source_id}: portal non-200", status=resp.status_code, url=url)
                return results
            body = resp.text
            if self._is_login_gated(body):
                self.log_warning(f"{self.source_id}: login gate at {url} — BLOCKED_AUTH")
                return results

            soup = BeautifulSoup(body, "html.parser")
            seen_titles: set = set()

            # Try table rows first
            for table in soup.find_all("table")[:5]:
                for row in table.find_all("tr")[1:]:
                    cells = row.find_all("td")
                    if len(cells) < 2:
                        continue
                    title_cell = None
                    for c in cells:
                        if c.find("a") or len(c.get_text(strip=True)) > 20:
                            title_cell = c
                            break
                    if not title_cell:
                        continue
                    title = title_cell.get_text(strip=True)
                    if len(title) < 10 or title in seen_titles:
                        continue
                    if not any(k in title.lower() for k in ["tender", "nit", "bid", "rfp", "notice", "quotation", "supply", "work"]):
                        continue
                    seen_titles.add(title)
                    link = title_cell.find("a")
                    detail_url = url
                    if link and link.get("href"):
                        href = link["href"]
                        base_url = f"https://{resp.url.host}"
                        detail_url = href if href.startswith("http") else f"{base_url}{href}"
                    # try to find date in neighboring cells
                    date_str = ""
                    for c in cells:
                        text = c.get_text(strip=True)
                        if re.search(r"\d{2}[/-]\d{2}[/-]\d{4}", text):
                            date_str = text
                            break
                    results.append({
                        "title": title[:300],
                        "ministry": self.MINISTRY,
                        "department": self.PSU_NAME,
                        "organisation": self.PSU_NAME,
                        "state": self.STATE,
                        "estimated_cost_lakhs": None,
                        "emd_lakhs": None,
                        "categories": self._infer_categories(title),
                        "procurement_method": "open",
                        "status": "active",
                        "published_at": datetime.utcnow().isoformat(),
                        "submission_deadline": self._parse_date(date_str),
                        "source_nit_no": None,
                        "source_detail_url": detail_url,
                    })

            # Also check hyperlinks
            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True)
                if len(text) < 15 or text in seen_titles:
                    continue
                if not any(k in text.lower() for k in ["tender", "nit", "rfp", "bid", "notice"]):
                    continue
                seen_titles.add(text)
                href = a["href"]
                base_url = f"https://{resp.url.host}"
                full_url = href if href.startswith("http") else f"{base_url}/{href.lstrip('/')}"
                results.append({
                    "title": text[:300],
                    "ministry": self.MINISTRY,
                    "department": self.PSU_NAME,
                    "organisation": self.PSU_NAME,
                    "state": self.STATE,
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

        except httpx.TimeoutException:
            self.log_warning(f"{self.source_id}: timeout scraping {url}")
        except Exception as e:
            self.log_warning(f"{self.source_id}: scrape error at {url}", error=str(e))

        return results

    async def _scrape_nic_psu(self, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        """Scrape NIC eProcure filtered by PSU keywords."""
        results = []
        if not self.PSU_KEYWORDS:
            return results
        try:
            resp = await client.get(self.NIC_URL, headers=self.HEADERS)
            if resp.status_code != 200 or self._is_login_gated(resp.text):
                return results
            soup = BeautifulSoup(resp.text, "html.parser")
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
                org = cells[1].get_text(strip=True)
                nit_no = cells[2].get_text(strip=True)
                title = cells[3].get_text(strip=True)
                last_date = cells[4].get_text(strip=True) if len(cells) > 4 else ""
                combined = (org + " " + title).lower()
                if not any(kw.lower() in combined for kw in self.PSU_KEYWORDS):
                    continue
                link = cells[3].find("a")
                detail_url = self.NIC_URL
                if link and link.get("href"):
                    href = link["href"]
                    detail_url = href if href.startswith("http") else f"{self.NIC_BASE}{href}"
                results.append({
                    "title": title,
                    "ministry": self.MINISTRY,
                    "department": org,
                    "organisation": self.PSU_NAME,
                    "state": self.STATE,
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
            self.log_warning(f"{self.source_id}: NIC PSU scrape error", error=str(e))
        return results

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """Fetch PSU tenders from own portal + NIC eProcure. No fixture data."""
        self.log_info(f"{self.source_id}: starting PSU scrape", psu=self.PSU_NAME)
        yielded = 0

        async with httpx.AsyncClient(timeout=self.timeout_seconds, follow_redirects=True) as client:
            # Try main portal
            for url in [self.TENDER_URL] + self.TENDER_URL_ALT:
                if not url:
                    continue
                results = await self._scrape_portal(client, url)
                for i, raw in enumerate(results):
                    yield RawTender(
                        source_id=self.source_id,
                        source_tender_id=raw.get("source_nit_no") or f"{self.source_id.upper()}-{i}",
                        source_url=raw.get("source_detail_url", url),
                        raw_json=raw,
                    )
                    yielded += 1
                if results:
                    break
                await asyncio.sleep(0.5)

            # NIC eProcure fallback
            nic = await self._scrape_nic_psu(client)
            for i, raw in enumerate(nic):
                yield RawTender(
                    source_id=self.source_id,
                    source_tender_id=raw.get("source_nit_no") or f"{self.source_id.upper()}-NIC-{i}",
                    source_url=raw.get("source_detail_url", self.NIC_URL),
                    raw_json=raw,
                )
                yielded += 1

        if not yielded:
            self.log_warning(
                f"{self.source_id}: 0 tenders — portal blocked or empty. BLOCKED_NETWORK.",
                psu=self.PSU_NAME,
            )
        else:
            self.log_info(f"{self.source_id}: crawl complete", psu=self.PSU_NAME, total=yielded)

    async def health_check(self) -> HealthStatus:
        if not self.TENDER_URL:
            return HealthStatus.DEGRADED
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(self.TENDER_URL, headers={"User-Agent": self.HEADERS["User-Agent"]})
                if resp.status_code == 200 and not self._is_login_gated(resp.text[:1000]):
                    return HealthStatus.HEALTHY
                return HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
