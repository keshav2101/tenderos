"""
Central Government Ministry Connectors — Phase 14.5.

All connectors extend MinistryBaseConnector which scrapes NIC eProcure live
and filters by MINISTRY_KEYWORDS.

Each ministry also has PORTAL_URL pointing to its own tender portal — the
_try_ministry_portal() override scrapes that page for additional notices.

Zero fixture data in this file. All connectors yield only real scraped tenders.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from app.connectors.plugins.central_gov.ministry_base import MinistryBaseConnector


# ─── Helper: generic HTML tender page scraper ────────────────────────────────

async def _scrape_generic_portal(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    ministry: str,
    source_id: str,
    timeout: float = 12.0,
) -> list[dict]:
    """Scrape a ministry's own tender listing page. Returns list of raw dicts."""
    results = []
    try:
        resp = await client.get(url, headers=headers, timeout=timeout)
        if resp.status_code != 200:
            return results
        body = resp.text
        if any(w in body.lower() for w in ["login", "captcha", "j_username"]):
            return results
        soup = BeautifulSoup(body, "html.parser")
        # Extract any hyperlinks that look like tender notices
        for a in soup.find_all("a", href=True):
            text = a.get_text(strip=True)
            if len(text) < 15:
                continue
            href = a["href"]
            if any(kw in text.lower() for kw in ["tender", "nit", "rfp", "bid", "notice", "quotation"]):
                full_url = href if href.startswith("http") else f"{url.rstrip('/')}/{href.lstrip('/')}"
                # Extract any date nearby
                parent_text = a.parent.get_text(" ", strip=True) if a.parent else ""
                date_match = re.search(r"\d{2}[/-]\d{2}[/-]\d{4}", parent_text)
                results.append({
                    "title": text[:300],
                    "ministry": ministry,
                    "department": ministry,
                    "organisation": ministry,
                    "state": "Delhi",
                    "estimated_cost_lakhs": None,
                    "emd_lakhs": None,
                    "categories": [],
                    "procurement_method": "open",
                    "status": "active",
                    "published_at": datetime.utcnow().isoformat(),
                    "submission_deadline": None,
                    "source_nit_no": None,
                    "source_detail_url": full_url,
                })
    except Exception:
        pass
    return results


# ─── CPWD ────────────────────────────────────────────────────────────────────

class CPWDConnector(MinistryBaseConnector):
    source_id = "cpwd"
    display_name = "CPWD — Central Public Works Department"
    description = "Public works and infrastructure procurement from CPWD"
    MINISTRY_NAME = "Ministry of Housing and Urban Affairs"
    MINISTRY_KEYWORDS = ["cpwd", "central public works", "housing", "urban affairs", "pwd"]
    MINISTRY_DEPT = "Central Public Works Department"
    PORTAL_URL = "https://etender.cpwd.gov.in"

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        return await _scrape_generic_portal(
            client, self.PORTAL_URL, self.HEADERS,
            self.MINISTRY_NAME, self.source_id,
        )


# ─── Defence ─────────────────────────────────────────────────────────────────

class DefenceConnector(MinistryBaseConnector):
    source_id = "defence"
    display_name = "Ministry of Defence — Procurement"
    description = "Defence capital and revenue procurement notices"
    MINISTRY_NAME = "Ministry of Defence"
    MINISTRY_KEYWORDS = [
        "ministry of defence", "mod", "army", "navy", "air force",
        "drdo", "ordnance", "brd", "dal", "defence",
    ]
    MINISTRY_DEPT = "Defence Procurement Organisation"
    PORTAL_URL = "https://mod.gov.in/depts/dod/procurement-policy"
    access_limitations = "MoD detailed RFPs require registered vendor login via DRDO/DPO portal"

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        return await _scrape_generic_portal(
            client, "https://mod.gov.in/depts/dod/procurement-policy",
            self.HEADERS, self.MINISTRY_NAME, self.source_id,
        )


# ─── DRDO ────────────────────────────────────────────────────────────────────

class DRDOConnector(MinistryBaseConnector):
    source_id = "drdo"
    display_name = "DRDO — Defence Research and Development Organisation"
    description = "Research equipment and materials procurement from DRDO labs"
    MINISTRY_NAME = "Ministry of Defence"
    MINISTRY_KEYWORDS = ["drdo", "defence research", "cair", "drdl", "dmrl", "deal"]
    MINISTRY_DEPT = "DRDO Headquarters"
    PORTAL_URL = "https://www.drdo.gov.in/tenders"
    access_limitations = "DRDO tender details require DRDO vendor portal login"

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        # DRDO moved tenders to different subdomain
        results = []
        for url in [
            "https://www.drdo.gov.in/tenders",
            "https://drdo.gov.in/procurement/tenders",
        ]:
            res = await _scrape_generic_portal(
                client, url, self.HEADERS, self.MINISTRY_NAME, self.source_id,
            )
            results.extend(res)
            if res:
                break
        return results


# ─── BEL ─────────────────────────────────────────────────────────────────────

class BELConnector(MinistryBaseConnector):
    source_id = "bel"
    display_name = "BEL — Bharat Electronics Limited"
    description = "Defence electronics and communication systems procurement"
    MINISTRY_NAME = "Ministry of Defence"
    MINISTRY_KEYWORDS = ["bel", "bharat electronics"]
    MINISTRY_DEPT = "BEL"
    PORTAL_URL = "https://bel-india.in/tenders"
    access_limitations = "BEL vendor portal requires prior vendor registration"

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        results = []
        for url in ["https://bel-india.in/tenders", "https://bel-india.in/tender"]:
            res = await _scrape_generic_portal(
                client, url, self.HEADERS, self.MINISTRY_NAME, self.source_id,
            )
            results.extend(res)
            if res:
                break
        return results


# ─── Ministry of Finance ──────────────────────────────────────────────────────

class MOFConnector(MinistryBaseConnector):
    source_id = "mof"
    display_name = "Ministry of Finance"
    description = "Financial services and IT procurement"
    MINISTRY_NAME = "Ministry of Finance"
    MINISTRY_KEYWORDS = [
        "ministry of finance", "department of revenue", "finmin",
        "comptroller", "income tax", "cbdt", "cbic",
    ]
    MINISTRY_DEPT = "Department of Economic Affairs"
    PORTAL_URL = "https://finmin.nic.in"


# ─── Ministry of Home Affairs ─────────────────────────────────────────────────

class MHAConnector(MinistryBaseConnector):
    source_id = "mha"
    display_name = "Ministry of Home Affairs"
    description = "Internal security and police equipment procurement"
    MINISTRY_NAME = "Ministry of Home Affairs"
    MINISTRY_KEYWORDS = [
        "ministry of home", "mha", "crpf", "bsf", "cisf", "nsg",
        "ssb", "itbp", "home affairs", "intelligence bureau",
    ]
    MINISTRY_DEPT = "Internal Security Division"
    PORTAL_URL = "https://mha.gov.in"


# ─── Ministry of Education ────────────────────────────────────────────────────

class MOEConnector(MinistryBaseConnector):
    source_id = "moe"
    display_name = "Ministry of Education"
    description = "Education infrastructure and IT procurement"
    MINISTRY_NAME = "Ministry of Education"
    MINISTRY_KEYWORDS = [
        "ministry of education", "department of school", "department of higher",
        "naac", "ugc", "aicte", "kendriya vidyalaya", "nvs", "nit ",
    ]
    MINISTRY_DEPT = "Department of School Education"
    PORTAL_URL = "https://education.gov.in"


# ─── Ministry of Health ───────────────────────────────────────────────────────

class MOHFWConnector(MinistryBaseConnector):
    source_id = "mohfw"
    display_name = "Ministry of Health and Family Welfare"
    description = "Medical equipment and hospital procurement"
    MINISTRY_NAME = "Ministry of Health and Family Welfare"
    MINISTRY_KEYWORDS = [
        "ministry of health", "mohfw", "nhm", "national health", "cghs",
        "esic", "aiims", "central government hospital", "hll lifecare",
    ]
    MINISTRY_DEPT = "Health Services"
    PORTAL_URL = "https://mohfw.gov.in"

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        results = []
        for url in [
            "https://mohfw.gov.in/about-us/departments/departments-health-research/tenders",
            "https://hllhealthcare.com/tenders",
        ]:
            res = await _scrape_generic_portal(
                client, url, self.HEADERS, self.MINISTRY_NAME, self.source_id,
            )
            results.extend(res)
        return results


# ─── Ministry of MSME ─────────────────────────────────────────────────────────

class MSMEConnector(MinistryBaseConnector):
    source_id = "msme"
    display_name = "Ministry of MSME"
    description = "MSME sector development and tooling procurement"
    MINISTRY_NAME = "Ministry of Micro, Small and Medium Enterprises"
    MINISTRY_KEYWORDS = [
        "msme", "micro small", "nsic", "kvic", "national small industries",
        "khadi", "development commissioner",
    ]
    MINISTRY_DEPT = "MSME Development Office"
    PORTAL_URL = "https://msme.gov.in"

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        return await _scrape_generic_portal(
            client, "https://msme.gov.in/tenders",
            self.HEADERS, self.MINISTRY_NAME, self.source_id,
        )


# ─── MoRTH ───────────────────────────────────────────────────────────────────

class MoRTHConnector(MinistryBaseConnector):
    source_id = "morth"
    display_name = "Ministry of Road Transport and Highways"
    description = "Highway and road infrastructure procurement"
    MINISTRY_NAME = "Ministry of Road Transport and Highways"
    MINISTRY_KEYWORDS = [
        "road transport", "morth", "nhai", "national highway", "highway",
    ]
    MINISTRY_DEPT = "Roads Division"
    PORTAL_URL = "https://morth.nic.in"


# ─── MoPNG ────────────────────────────────────────────────────────────────────

class MoPNGConnector(MinistryBaseConnector):
    source_id = "mopng"
    display_name = "Ministry of Petroleum and Natural Gas"
    description = "Oil and gas sector procurement"
    MINISTRY_NAME = "Ministry of Petroleum and Natural Gas"
    MINISTRY_KEYWORDS = [
        "petroleum", "natural gas", "ongc", "iocl", "hpcl", "bpcl", "gail",
        "eil", "pngrb",
    ]
    MINISTRY_DEPT = "Petroleum Division"
    PORTAL_URL = "https://mopng.gov.in"


# ─── MoP ─────────────────────────────────────────────────────────────────────

class MoPowerConnector(MinistryBaseConnector):
    source_id = "mopower"
    display_name = "Ministry of Power"
    description = "Power sector and electricity procurement"
    MINISTRY_NAME = "Ministry of Power"
    MINISTRY_KEYWORDS = [
        "ministry of power", "ntpc", "power grid", "pgcil",
        "nhpc", "thdc", "sjvn", "rea", "discoms",
    ]
    MINISTRY_DEPT = "Power Division"
    PORTAL_URL = "https://powermin.gov.in"


# ─── MoTI ─────────────────────────────────────────────────────────────────────

class MoITConnector(MinistryBaseConnector):
    source_id = "meit"
    display_name = "Ministry of Electronics and IT"
    description = "IT and digital infrastructure procurement"
    MINISTRY_NAME = "Ministry of Electronics and Information Technology"
    MINISTRY_KEYWORDS = [
        "meity", "electronics", "nic", "national informatics",
        "digital india", "cdac", "stqc", "deity",
    ]
    MINISTRY_DEPT = "Digital India Division"
    PORTAL_URL = "https://meity.gov.in"

    async def _try_ministry_portal(self, client: httpx.AsyncClient) -> list[dict]:
        return await _scrape_generic_portal(
            client, "https://meity.gov.in/content/tenders",
            self.HEADERS, self.MINISTRY_NAME, self.source_id,
        )


# ─── MoAFW ────────────────────────────────────────────────────────────────────

class MoAgricultureConnector(MinistryBaseConnector):
    source_id = "moagri"
    display_name = "Ministry of Agriculture and Farmers Welfare"
    description = "Agriculture infrastructure and input procurement"
    MINISTRY_NAME = "Ministry of Agriculture and Farmers Welfare"
    MINISTRY_KEYWORDS = [
        "agriculture", "farmer", "krishi", "icar", "nafed", "fci",
        "horticulture",
    ]
    MINISTRY_DEPT = "Agriculture Division"
    PORTAL_URL = "https://agricoop.nic.in"


# ─── MoJSK ────────────────────────────────────────────────────────────────────

class MoJalShaktiConnector(MinistryBaseConnector):
    source_id = "mojsk"
    display_name = "Ministry of Jal Shakti"
    description = "Water supply, irrigation and sanitation procurement"
    MINISTRY_NAME = "Ministry of Jal Shakti"
    MINISTRY_KEYWORDS = [
        "jal shakti", "water supply", "irrigation", "dam", "reservoir",
        "swachh bharat", "namami gange", "wcd",
    ]
    MINISTRY_DEPT = "Water Resources"
    PORTAL_URL = "https://jalshakti-dowr.gov.in"
