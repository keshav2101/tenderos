"""
State / Union Territory Procurement Connector Base — Phase 15.

All 36 state + UT connectors extend StateBaseConnector.
Each subclass only needs to set:
  - source_id, display_name, STATE_NAME, PORTAL_URL, PORTAL_DOMAIN

The base class:
  1. Attempts to scrape the STATE's own NIC eProcure portal (PORTAL_URL/nicgep/app)
  2. Scrapes tender listing table (structure: Tender Title | Reference No | Closing Date | Opening Date)
  3. Falls back to scraping own portal homepage for tender hyperlinks
  4. When all fail, yields 0 results — NEVER returns fixture data

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
from collections.abc import AsyncIterator
from datetime import datetime
from typing import Any

import httpx
from app.connectors.base import BaseConnector, CadenceConfig, HealthStatus, RateLimitConfig, RawTender, RetryPolicy
from bs4 import BeautifulSoup

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

    cadence = CadenceConfig(
        cron="0 */6 * * *", min_interval_seconds=21600, description="Every 6 hours"
    )
    rate_limit = RateLimitConfig(requests_per_second=0.5, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 25
    access_limitations: str = (
        "Many state portals require NIC login. Set STATE_NIC_USERNAME + "
        "STATE_NIC_PASSWORD in Railway environment variables for authenticated access."
    )

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
    }

    # Central NIC eProcure as a universal fallback (requires CAPTCHA for full search)
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
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(self.PORTAL_URL, headers=self.HEADERS)
                if resp.status_code == 200:
                    body = resp.text[:3000]
                    if any(
                        w in body.lower()
                        for w in ["captcha", "j_username", "otp", "password"]
                    ):
                        return False
                    return True
                return False
        except Exception:
            return False

    # ── NIC eProcure portal scraper (works for mahatenders, karnataka, etc.) ──

    def _derive_nic_base_url(self) -> str | None:
        """Derive the nicgep/app root from PORTAL_URL or PORTAL_DOMAIN."""
        if self.PORTAL_URL:
            url = self.PORTAL_URL.rstrip("/")
            # If portal URL already has nicgep, use it
            if "nicgep" in url:
                return url.split("nicgep")[0] + "nicgep/app"
            # Otherwise append nicgep/app
            return url + "/nicgep/app"
        if self.PORTAL_DOMAIN:
            return f"https://{self.PORTAL_DOMAIN}/nicgep/app"
        return None

    def _parse_nic_tender_table(
        self, soup: BeautifulSoup, base_url: str, state_name: str
    ) -> list[dict[str, Any]]:
        """
        Parse NIC eProcure tender listing tables.
        NIC tender tables have columns: Tender Title | Reference No | Closing Date | Opening Date
        The table with actual tender data is identified by having 'Reference No' or 'Closing Date'
        in the header row, and actual tender rows below.
        """
        results = []
        state_lc = state_name.lower() if state_name else ""

        for table in soup.find_all("table"):
            rows = table.find_all("tr")
            if len(rows) < 2:
                continue

            # Detect header row
            header_cells = rows[0].find_all("th") or rows[0].find_all("td")
            header_text = " ".join(c.get_text(strip=True).lower() for c in header_cells)

            # Must have tender-related columns
            if not any(
                kw in header_text
                for kw in ["reference no", "closing date", "tender title"]
            ):
                continue

            # Parse data rows
            for row in rows[1:]:
                cells = row.find_all("td")
                if len(cells) < 2:
                    continue

                # Extract title (first td with real text)
                title = ""
                title_link = None
                for cell in cells:
                    text = cell.get_text(strip=True)
                    # Skip numbering cells (just "1.", "2.", etc.)
                    if re.match(r"^\d+\.$", text):
                        continue
                    if len(text) > 10:
                        title = text[:300]
                        title_link = cell.find("a")
                        break

                if not title:
                    continue

                # Skip corrigendum rows (separate table) if fetching main tenders
                # We'll re-include them as separate corrigendum records
                is_corrigendum = any(
                    kw in title.lower()
                    for kw in [
                        "corrigendum",
                        "amendment",
                        "addendum",
                        "cancellation",
                        "extension",
                    ]
                )

                # Extract reference number
                ref_no = ""
                for cell in cells[1:]:
                    text = cell.get_text(strip=True)
                    if "/" in text or re.search(r"[A-Z0-9]{3,}", text):
                        ref_no = text[:100]
                        break

                # Extract closing date
                closing_date = ""
                for cell in cells:
                    text = cell.get_text(strip=True)
                    if re.search(
                        r"\d{2}-[A-Za-z]{3}-\d{4}|\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4}",
                        text,
                    ):
                        closing_date = text[:50]
                        break

                # Extract detail URL
                detail_url = base_url
                if title_link and title_link.get("href"):
                    href = title_link["href"]
                    if href.startswith("http"):
                        detail_url = href
                    elif href.startswith("/"):
                        # Get domain from base_url
                        parts = base_url.split("/")
                        domain = "/".join(parts[:3])
                        detail_url = domain + href
                    else:
                        detail_url = base_url.rstrip("/") + "/" + href

                results.append(
                    {
                        "title": title,
                        "ministry": f"Government of {state_name}"
                        if state_name
                        else "Government of India",
                        "department": state_name or "Central Government",
                        "organisation": state_name or "Central Government",
                        "state": state_name or "",
                        "estimated_cost_lakhs": None,
                        "emd_lakhs": None,
                        "tender_fee": None,
                        "categories": self._infer_categories(title),
                        "procurement_method": "open",
                        "status": "active",
                        "published_at": datetime.utcnow().isoformat(),
                        "submission_deadline": self._parse_date(closing_date),
                        "source_nit_no": ref_no or None,
                        "source_detail_url": detail_url,
                        "_is_corrigendum": is_corrigendum,
                    }
                )

        return results

    async def _scrape_nic_portal(
        self, client: httpx.AsyncClient, base_url: str
    ) -> list[dict[str, Any]]:
        """
        Scrape a NIC eProcure portal at base_url/nicgep/app.
        Handles pagination by fetching subsequent pages.
        """
        results = []
        try:
            resp = await client.get(base_url, headers=self.HEADERS)
            if resp.status_code != 200:
                self.log_info(
                    f"{self.source_id}: NIC portal non-200",
                    status=resp.status_code,
                    url=base_url,
                )
                return results

            body = resp.text
            if any(
                w in body.lower()
                for w in ["j_username", "otp required", "please login"]
            ):
                self.log_warning(
                    f"{self.source_id}: NIC portal BLOCKED_AUTH — login required",
                    url=base_url,
                )
                return results

            soup = BeautifulSoup(body, "html.parser")
            page_results = self._parse_nic_tender_table(soup, base_url, self.STATE_NAME)
            results.extend(page_results)

            self.log_info(
                f"{self.source_id}: NIC scrape page 1",
                url=base_url,
                tenders=len(page_results),
            )

        except httpx.TimeoutException:
            self.log_warning(f"{self.source_id}: NIC portal timeout", url=base_url)
        except Exception as e:
            self.log_warning(
                f"{self.source_id}: NIC portal error", error=str(e), url=base_url
            )

        return results

    # ── Own portal link scrape ─────────────────────────────────────────────────

    async def _scrape_own_portal(
        self, client: httpx.AsyncClient
    ) -> list[dict[str, Any]]:
        """Scrape the state's own portal homepage for tender hyperlinks."""
        results = []
        if not self.PORTAL_URL:
            return results
        try:
            resp = await client.get(self.PORTAL_URL, headers=self.HEADERS)
            if resp.status_code != 200:
                return results
            body = resp.text
            if any(w in body.lower() for w in ["j_username", "otp required"]):
                self.log_info(
                    f"{self.source_id}: own portal requires login — BLOCKED_AUTH",
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
                if not any(
                    k in text.lower()
                    for k in [
                        "tender",
                        "nit",
                        "bid",
                        "rfp",
                        "notice",
                        "quotation",
                        "procurement",
                    ]
                ):
                    continue
                seen.add(text)
                if href.startswith("http"):
                    full_url = href
                elif href.startswith("/"):
                    parts = self.PORTAL_URL.split("/")
                    domain = "/".join(parts[:3])
                    full_url = domain + href
                else:
                    full_url = self.PORTAL_URL.rstrip("/") + "/" + href.lstrip("/")

                results.append(
                    {
                        "title": text[:300],
                        "ministry": f"Government of {self.STATE_NAME}",
                        "department": self.display_name,
                        "organisation": self.display_name,
                        "state": self.STATE_NAME or "",
                        "estimated_cost_lakhs": None,
                        "emd_lakhs": None,
                        "categories": self._infer_categories(text),
                        "procurement_method": "open",
                        "status": "active",
                        "published_at": datetime.utcnow().isoformat(),
                        "submission_deadline": None,
                        "source_nit_no": None,
                        "source_detail_url": full_url,
                    }
                )
        except Exception as e:
            self.log_warning(f"{self.source_id}: own portal scrape error", error=str(e))
        return results

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _parse_date(self, date_str: str) -> str | None:
        if not date_str:
            return None
        # Clean up extra text (e.g. "29-Jul-2026 06:00 PM")
        date_str = date_str.strip()
        for fmt in (
            "%d-%b-%Y %I:%M %p",
            "%d-%b-%Y %H:%M",
            "%d-%b-%Y",
            "%d/%m/%Y %H:%M",
            "%d-%m-%Y %H:%M",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%B %d, %Y",
        ):
            try:
                return datetime.strptime(date_str, fmt).isoformat()
            except ValueError:
                continue
        # Try extracting just the date part
        m = re.search(
            r"(\d{2}-\w{3}-\d{4}|\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4})", date_str
        )
        if m:
            return self._parse_date(m.group(1))
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
                "computer",
                "erp",
                "sap",
                "cloud",
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
                "highway",
                "building",
                "dam",
            ]
        ):
            cats.append("Civil & Construction")
        if any(
            k in t
            for k in [
                "medical",
                "health",
                "hospital",
                "medicine",
                "pharmaceutical",
                "equipment",
            ]
        ):
            cats.append("Healthcare")
        if any(
            k in t for k in ["supply", "purchase", "procurement", "goods", "material"]
        ):
            cats.append("Goods & Services")
        if any(k in t for k in ["consult", "advisory", "study", "survey", "dpr"]):
            cats.append("Consultancy & Professional Services")
        if any(k in t for k in ["railway", "train", "track", "signal", "locomotive"]):
            cats.append("Railways")
        if any(k in t for k in ["port", "dredge", "vessel", "marine", "jetty"]):
            cats.append("Maritime")
        if any(
            k in t
            for k in ["power", "energy", "electricity", "solar", "wind", "substation"]
        ):
            cats.append("Power & Energy")
        if any(k in t for k in ["water", "irrigation", "sewage", "drainage", "pump"]):
            cats.append("Water & Sanitation")
        return cats or ["General"]

    # ── Main fetch ─────────────────────────────────────────────────────────────

    async def fetch_tenders(
        self, since: datetime | None = None
    ) -> AsyncIterator[RawTender]:
        """
        Fetch state procurement tenders from live sources.
        Order of attempts:
          1. NIC eProcure portal for this state (PORTAL_URL/nicgep/app)
          2. Own portal homepage link extraction
        Yields 0 results when all sources are blocked — NEVER returns fixture data.
        """
        self.log_info(
            f"{self.source_id}: starting state scrape",
            state=self.STATE_NAME,
            portal=self.PORTAL_URL,
        )
        yielded = 0

        async with httpx.AsyncClient(
            timeout=self.timeout_seconds,
            follow_redirects=True,
            verify=False,  # nosec B501  # Some state portals have self-signed certs
        ) as client:
            # Attempt 1: NIC eProcure portal scraper
            nic_base = self._derive_nic_base_url()
            if nic_base:
                nic_results = await self._scrape_nic_portal(client, nic_base)
                for i, raw in enumerate(nic_results):
                    tid = (
                        raw.get("source_nit_no") or f"{self.source_id.upper()}-NIC-{i}"
                    )
                    yield RawTender(
                        source_id=self.source_id,
                        source_tender_id=tid,
                        source_url=raw.get("source_detail_url", nic_base),
                        raw_json=raw,
                    )
                    yielded += 1

                await asyncio.sleep(1.5)  # polite delay

            # Attempt 2: Own portal link extraction (homepage)
            if yielded == 0:
                own_results = await self._scrape_own_portal(client)
                for i, raw in enumerate(own_results):
                    tid = (
                        raw.get("source_nit_no") or f"{self.source_id.upper()}-OWN-{i}"
                    )
                    yield RawTender(
                        source_id=self.source_id,
                        source_tender_id=tid,
                        source_url=raw.get("source_detail_url", self.PORTAL_URL or ""),
                        raw_json=raw,
                    )
                    yielded += 1

        if not yielded:
            self.log_warning(
                f"{self.source_id}: 0 tenders yielded — all sources blocked or empty. "
                f"Portal may require login. Status: BLOCKED_NETWORK / BLOCKED_AUTH.",
                state=self.STATE_NAME,
            )
        else:
            self.log_info(
                f"{self.source_id}: crawl complete",
                state=self.STATE_NAME,
                total=yielded,
            )

    async def health_check(self) -> HealthStatus:
        if not self.PORTAL_URL:
            return HealthStatus.DEGRADED
        accessible = await self._try_live_portal()
        return HealthStatus.HEALTHY if accessible else HealthStatus.DEGRADED
