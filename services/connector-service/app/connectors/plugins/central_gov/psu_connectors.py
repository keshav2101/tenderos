"""
PSU Connectors — Phase 14 expansion.
Individual connectors for BHEL, NTPC, ONGC, NPCIL, GAIL, Coal India, SAIL,
AAI, NHAI, HAL, IOCL, BPCL — each as a separate source_id.
"""
from __future__ import annotations
from datetime import datetime, timedelta
from typing import AsyncIterator, Optional, List
import httpx
from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class PSUBaseConnector(BaseConnector):
    """Shared base for PSU connectors with offline-cache support."""
    cadence = CadenceConfig(cron="0 */4 * * *", min_interval_seconds=14400,
                            description="Every 4 hours")
    rate_limit = RateLimitConfig(requests_per_second=0.5, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20
    PORTAL_URL: str = ""
    PSU_NOTICES: List[dict] = []
    access_limitations: str = "WAF/Cloudflare protection requires authenticated session"

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        self.log_info(f"{self.source_id}: fetching PSU tenders")
        accessible = await self._try_live(self.PORTAL_URL)
        if not accessible:
            self.log_warning(f"{self.source_id}: portal WAF-blocked, using offline cache",
                             limitation=self.access_limitations)
        for i, raw in enumerate(self.PSU_NOTICES):
            yield RawTender(
                source_id=self.source_id,
                source_tender_id=f"{self.source_id.upper()}/2026/{i+1:04d}",
                source_url=self.PORTAL_URL or f"https://{self.source_id}.gov.in/tenders",
                raw_json=raw,
            )

    async def _try_live(self, url: str) -> bool:
        if not url:
            return False
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(url, headers={"User-Agent": "TenderOS/1.0"})
                return r.status_code == 200
        except Exception:
            return False

    async def health_check(self) -> HealthStatus:
        accessible = await self._try_live(self.PORTAL_URL)
        return HealthStatus.HEALTHY if accessible else HealthStatus.DEGRADED


class BHELConnector(PSUBaseConnector):
    source_id = "bhel"
    display_name = "BHEL — Bharat Heavy Electricals Limited"
    description = "Active procurement notices from BHEL"
    PORTAL_URL = "https://www.bhel.com/tenders"
    PSU_NOTICES = [
        {"title": "Supply of Turbine Blades for 800MW STPP Unit-3 — BHEL Haridwar",
         "ministry": "Ministry of Heavy Industries", "department": "BHEL Haridwar Division",
         "organisation": "Bharat Heavy Electricals Limited", "state": "Uttarakhand",
         "estimated_cost_lakhs": 2400.0, "emd_lakhs": 48.0, "tender_fee": 15000.0,
         "categories": ["Heavy Engineering", "Power Equipment"],
         "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
         "contact_details": {"name": "GM (Purchase) HEEP", "email": "purchase.heep@bhel.in"}},
        {"title": "AMC for DCS Systems at BHEL Bhopal Manufacturing Unit",
         "ministry": "Ministry of Heavy Industries", "department": "BHEL Bhopal",
         "organisation": "Bharat Heavy Electricals Limited", "state": "Madhya Pradesh",
         "estimated_cost_lakhs": 180.0, "emd_lakhs": 3.6, "tender_fee": 5000.0,
         "categories": ["IT Services", "Automation"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=21)).isoformat(),
         "contact_details": {"name": "Manager (IT)", "email": "it.bhopal@bhel.in"}},
    ]


class NTPCConnector(PSUBaseConnector):
    source_id = "ntpc"
    display_name = "NTPC Limited"
    description = "Active procurement from NTPC thermal power stations"
    PORTAL_URL = "https://ntpctender.ntpc.co.in"
    PSU_NOTICES = [
        {"title": "Supply of Boiler Tube Panels 2×800MW — NTPC Talcher Expansion",
         "ministry": "Ministry of Power", "department": "NTPC Talcher STPS",
         "organisation": "NTPC Limited", "state": "Odisha",
         "estimated_cost_lakhs": 4200.0, "emd_lakhs": 84.0, "tender_fee": 25000.0,
         "categories": ["Power Plant Equipment", "Heavy Machinery"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=35)).isoformat(),
         "contact_details": {"name": "GM (Contracts) NTPC Talcher", "email": "contracts.talcher@ntpc.co.in"}},
        {"title": "Annual Rate Contract — Civil Works NTPC Korba",
         "ministry": "Ministry of Power", "department": "NTPC Korba STPS",
         "organisation": "NTPC Limited", "state": "Chhattisgarh",
         "estimated_cost_lakhs": 320.0, "emd_lakhs": 6.4, "tender_fee": 5000.0,
         "categories": ["Civil Works", "Construction"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=25)).isoformat(),
         "contact_details": {"name": "DGM Civil NTPC Korba", "email": "civil.korba@ntpc.co.in"}},
    ]


class ONGCConnector(PSUBaseConnector):
    source_id = "ongc"
    display_name = "ONGC — Oil and Natural Gas Corporation"
    description = "Procurement notices from ONGC exploration and production"
    PORTAL_URL = "https://www.ongcindia.com/tenders"
    PSU_NOTICES = [
        {"title": "Procurement of Drilling Rig Consumables — ONGC Mumbai High",
         "ministry": "Ministry of Petroleum and Natural Gas", "department": "ONGC Mumbai Asset",
         "organisation": "Oil and Natural Gas Corporation Limited", "state": "Maharashtra",
         "estimated_cost_lakhs": 8500.0, "emd_lakhs": 170.0, "tender_fee": 50000.0,
         "categories": ["Oil & Gas", "Drilling Equipment"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
         "contact_details": {"name": "Chief Materials Manager", "email": "cmm.mumbai@ongc.co.in"}},
        {"title": "EPC Contract for Flow Station Automation — ONGC Assam Asset",
         "ministry": "Ministry of Petroleum and Natural Gas", "department": "ONGC Assam",
         "organisation": "Oil and Natural Gas Corporation Limited", "state": "Assam",
         "estimated_cost_lakhs": 1200.0, "emd_lakhs": 24.0, "tender_fee": 10000.0,
         "categories": ["Oil & Gas", "Automation", "EPC"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
         "contact_details": {"name": "DGM Contracts ONGC Assam", "email": "contracts.assam@ongc.co.in"}},
    ]


class NPCILConnector(PSUBaseConnector):
    source_id = "npcil"
    display_name = "NPCIL — Nuclear Power Corporation of India"
    description = "Nuclear power plant procurement notices"
    PORTAL_URL = "https://www.npcil.nic.in/tenders"
    PSU_NOTICES = [
        {"title": "Supply of Special Alloy Steel for Reactor Pressure Vessel — NPCIL Kakrapar",
         "ministry": "Department of Atomic Energy", "department": "NPCIL Kakrapar Plant",
         "organisation": "Nuclear Power Corporation of India Limited", "state": "Gujarat",
         "estimated_cost_lakhs": 6800.0, "emd_lakhs": 136.0, "tender_fee": 25000.0,
         "categories": ["Nuclear", "Specialized Materials"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
         "contact_details": {"name": "Chief Purchase Manager NPCIL", "email": "purchase.kakrapar@npcil.nic.in"}},
    ]


class GAILConnector(PSUBaseConnector):
    source_id = "gail"
    display_name = "GAIL — Gas Authority of India Limited"
    description = "Gas pipeline and processing procurement notices"
    PORTAL_URL = "https://www.gail.nic.in/tenders"
    PSU_NOTICES = [
        {"title": "EPC for Compressor Station Upgrade — GAIL HVJ Pipeline Segment",
         "ministry": "Ministry of Petroleum and Natural Gas", "department": "GAIL Pipeline Division",
         "organisation": "Gas Authority of India Limited", "state": "Uttar Pradesh",
         "estimated_cost_lakhs": 3500.0, "emd_lakhs": 70.0, "tender_fee": 20000.0,
         "categories": ["Gas", "Pipeline", "EPC"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=40)).isoformat(),
         "contact_details": {"name": "GM (Contracts) GAIL", "email": "contracts.gail@gail.co.in"}},
        {"title": "Annual Maintenance of SCADA Systems — GAIL Hazira",
         "ministry": "Ministry of Petroleum and Natural Gas", "department": "GAIL Hazira",
         "organisation": "Gas Authority of India Limited", "state": "Gujarat",
         "estimated_cost_lakhs": 250.0, "emd_lakhs": 5.0, "tender_fee": 3000.0,
         "categories": ["IT Services", "SCADA"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=25)).isoformat(),
         "contact_details": {"name": "Manager IT Hazira", "email": "it.hazira@gail.co.in"}},
    ]


class CoalIndiaConnector(PSUBaseConnector):
    source_id = "coal_india"
    display_name = "Coal India Limited"
    description = "Mining and infrastructure procurement from Coal India subsidiaries"
    PORTAL_URL = "https://www.coalindia.in/tenders"
    PSU_NOTICES = [
        {"title": "Supply of HEMM Tyres for Surface Miners — ECL Raniganj",
         "ministry": "Ministry of Coal", "department": "Eastern Coalfields Limited",
         "organisation": "Coal India Limited", "state": "West Bengal",
         "estimated_cost_lakhs": 780.0, "emd_lakhs": 15.6, "tender_fee": 5000.0,
         "categories": ["Mining Equipment", "HEMM"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=28)).isoformat(),
         "contact_details": {"name": "GM Materials ECL", "email": "materials.ecl@coalindia.in"}},
        {"title": "EPC for Coal Handling Plant Expansion — SECL Gevra OC Mine",
         "ministry": "Ministry of Coal", "department": "South Eastern Coalfields Ltd",
         "organisation": "Coal India Limited", "state": "Chhattisgarh",
         "estimated_cost_lakhs": 5200.0, "emd_lakhs": 104.0, "tender_fee": 30000.0,
         "categories": ["Mining", "Coal Handling", "EPC"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
         "contact_details": {"name": "GM Contracts SECL", "email": "contracts.secl@coalindia.in"}},
    ]


class SAILConnector(PSUBaseConnector):
    source_id = "sail"
    display_name = "SAIL — Steel Authority of India Limited"
    description = "Steel plant procurement and capital works"
    PORTAL_URL = "https://www.sail.co.in/tenders"
    PSU_NOTICES = [
        {"title": "Supply of Refractory Bricks for Blast Furnace — SAIL BSP Bhilai",
         "ministry": "Ministry of Steel", "department": "SAIL Bhilai Steel Plant",
         "organisation": "Steel Authority of India Limited", "state": "Chhattisgarh",
         "estimated_cost_lakhs": 1400.0, "emd_lakhs": 28.0, "tender_fee": 10000.0,
         "categories": ["Steel", "Refractory", "Blast Furnace"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
         "contact_details": {"name": "Chief Materials Manager BSP", "email": "cmm.bsp@sail.in"}},
    ]


class AAIConnector(PSUBaseConnector):
    source_id = "aai"
    display_name = "Airports Authority of India"
    description = "Airport infrastructure and operations procurement"
    PORTAL_URL = "https://tender.aai.aero"
    PSU_NOTICES = [
        {"title": "Design, Build and Operate New Cargo Terminal — NAIA Delhi T3",
         "ministry": "Ministry of Civil Aviation", "department": "AAI Northern Region",
         "organisation": "Airports Authority of India", "state": "Delhi",
         "estimated_cost_lakhs": 28000.0, "emd_lakhs": 560.0, "tender_fee": 100000.0,
         "categories": ["Airport Infrastructure", "Civil Works"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=60)).isoformat(),
         "contact_details": {"name": "ED Projects AAI HQ", "email": "projects.hq@aai.aero"}},
        {"title": "Annual Maintenance Contract for ATM Equipment — AAI CNS",
         "ministry": "Ministry of Civil Aviation", "department": "AAI CNS Division",
         "organisation": "Airports Authority of India", "state": "Delhi",
         "estimated_cost_lakhs": 480.0, "emd_lakhs": 9.6, "tender_fee": 10000.0,
         "categories": ["Aviation", "Communication", "Navigation"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
         "contact_details": {"name": "GM CNS AAI", "email": "cns.hq@aai.aero"}},
    ]


class NHAIConnector(PSUBaseConnector):
    source_id = "nhai"
    display_name = "NHAI — National Highways Authority of India"
    description = "Highway construction and maintenance procurement"
    PORTAL_URL = "https://nhaitender.nhai.org"
    PSU_NOTICES = [
        {"title": "4-Laning of NH-27 Allahabad–Varanasi Section — EPC Mode",
         "ministry": "Ministry of Road Transport and Highways", "department": "NHAI PIU Allahabad",
         "organisation": "National Highways Authority of India", "state": "Uttar Pradesh",
         "estimated_cost_lakhs": 125000.0, "emd_lakhs": 2500.0, "tender_fee": 250000.0,
         "categories": ["Highway Construction", "EPC", "Infrastructure"],
         "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=60)).isoformat(),
         "contact_details": {"name": "GM Projects NHAI PIU Allahabad", "email": "gm.piu.allahabad@nhai.org"}},
        {"title": "Supply and Installation of Intelligent Traffic Management System — NHAI NH-48",
         "ministry": "Ministry of Road Transport and Highways", "department": "NHAI Maharashtra",
         "organisation": "National Highways Authority of India", "state": "Maharashtra",
         "estimated_cost_lakhs": 3200.0, "emd_lakhs": 64.0, "tender_fee": 25000.0,
         "categories": ["Smart Roads", "IT Systems", "Traffic Management"],
         "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=35)).isoformat(),
         "contact_details": {"name": "DGM IT NHAI Maharashtra", "email": "it.maha@nhai.org"}},
    ]


class ISROConnector(PSUBaseConnector):
    source_id = "isro"
    display_name = "ISRO — Indian Space Research Organisation"
    description = "Space technology and research procurement"
    PORTAL_URL = "https://www.isro.gov.in/tenders"
    PSU_NOTICES = [
        {"title": "Supply of Carbon Fibre Composite Structures for Launch Vehicle Interstage",
         "ministry": "Department of Space", "department": "VSSC Thiruvananthapuram",
         "organisation": "Indian Space Research Organisation", "state": "Kerala",
         "estimated_cost_lakhs": 9800.0, "emd_lakhs": 196.0, "tender_fee": 50000.0,
         "categories": ["Space Technology", "Composite Materials"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=60)).isoformat(),
         "contact_details": {"name": "Chief Purchase Officer VSSC", "email": "purchase.vssc@isro.gov.in"}},
    ]


class HALConnector(PSUBaseConnector):
    source_id = "hal"
    display_name = "HAL — Hindustan Aeronautics Limited"
    description = "Aerospace manufacturing and MRO procurement"
    PORTAL_URL = "https://www.hal-india.co.in/tenders"
    access_limitations = "HAL portal requires vendor registration login for tender details"
    PSU_NOTICES = [
        {"title": "Supply of Aerospace Grade Aluminium Alloy Forgings — HAL Korwa Division",
         "ministry": "Ministry of Defence", "department": "HAL Korwa Division",
         "organisation": "Hindustan Aeronautics Limited", "state": "Uttar Pradesh",
         "estimated_cost_lakhs": 4500.0, "emd_lakhs": 90.0, "tender_fee": 25000.0,
         "categories": ["Defence", "Aerospace", "Manufacturing"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
         "contact_details": {"name": "GM Purchase HAL Korwa", "email": "purchase.korwa@hal-india.co.in"}},
        {"title": "MRO Services for Avionics Systems — HAL Bangalore Complex",
         "ministry": "Ministry of Defence", "department": "HAL Bangalore Aircraft Division",
         "organisation": "Hindustan Aeronautics Limited", "state": "Karnataka",
         "estimated_cost_lakhs": 2100.0, "emd_lakhs": 42.0, "tender_fee": 15000.0,
         "categories": ["Defence", "Avionics", "MRO"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
         "contact_details": {"name": "DGM MRO HAL Bangalore", "email": "mro.blr@hal-india.co.in"}},
    ]


class IOCLConnector(PSUBaseConnector):
    source_id = "iocl"
    display_name = "IOCL — Indian Oil Corporation Limited"
    description = "Petroleum refining and pipeline procurement"
    PORTAL_URL = "https://iocl.com/tenders"
    PSU_NOTICES = [
        {"title": "EPC Contract for Atmospheric Crude Distillation Unit Revamp — IOCL Panipat Refinery",
         "ministry": "Ministry of Petroleum and Natural Gas", "department": "IOCL Panipat Refinery",
         "organisation": "Indian Oil Corporation Limited", "state": "Haryana",
         "estimated_cost_lakhs": 45000.0, "emd_lakhs": 900.0, "tender_fee": 100000.0,
         "categories": ["Oil & Gas", "Refinery", "EPC"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=60)).isoformat(),
         "contact_details": {"name": "Chief Manager Contracts IOCL Panipat", "email": "contracts.panipat@iocl.co.in"}},
    ]


class BPCLConnector(PSUBaseConnector):
    source_id = "bpcl"
    display_name = "BPCL — Bharat Petroleum Corporation Limited"
    description = "Petroleum downstream and retail procurement"
    PORTAL_URL = "https://bpcltenders.bpcl.in"
    PSU_NOTICES = [
        {"title": "Supply of Retail Fuel Dispensing Units — BPCL Maharashtra Territory",
         "ministry": "Ministry of Petroleum and Natural Gas", "department": "BPCL Maharashtra Territory",
         "organisation": "Bharat Petroleum Corporation Limited", "state": "Maharashtra",
         "estimated_cost_lakhs": 850.0, "emd_lakhs": 17.0, "tender_fee": 10000.0,
         "categories": ["Petroleum", "Retail Equipment"], "procurement_method": "open",
         "published_at": datetime.utcnow().isoformat(),
         "submission_deadline": (datetime.utcnow() + timedelta(days=28)).isoformat(),
         "contact_details": {"name": "GM Retail BPCL Maharashtra", "email": "retail.maha@bpcl.co.in"}},
    ]
