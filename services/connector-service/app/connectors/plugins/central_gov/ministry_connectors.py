"""
Central Government Ministry Connectors — Phase 14.
Covers: CPWD, Defence (MoD), DRDO, BEL, MoF, MHA, MoE, MoHFW, MSME.
All extend MinistryBaseConnector with ministry-specific notice data.
"""
from __future__ import annotations
from datetime import datetime, timedelta
from typing import List, AsyncIterator, Optional
import httpx
from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)
from app.connectors.plugins.central_gov.ministry_base import MinistryBaseConnector


class CPWDConnector(MinistryBaseConnector):
    source_id = "cpwd"
    display_name = "CPWD — Central Public Works Department"
    description = "Public works and infrastructure procurement from CPWD"
    MINISTRY_NAME = "Ministry of Housing and Urban Affairs"
    MINISTRY_DEPT = "Central Public Works Department"
    PORTAL_URL = "https://etender.cpwd.gov.in"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Construction of Multi-Storey Residential Quarters — CPWD Delhi Zone",
             "ministry": "Ministry of Housing and Urban Affairs",
             "department": "CPWD Delhi Zone", "organisation": "Central Public Works Department",
             "state": "Delhi", "estimated_cost_lakhs": 8500.0, "emd_lakhs": 170.0,
             "tender_fee": 25000.0, "categories": ["Civil Construction", "Residential"],
             "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
             "contact_details": {"name": "Executive Engineer CPWD Delhi", "email": "ee.delhi@cpwd.gov.in"}},
            {"title": "Annual Rate Contract — Electrical Works Central Secretariat Complex",
             "ministry": "Ministry of Housing and Urban Affairs",
             "department": "CPWD Electrical Division", "organisation": "CPWD",
             "state": "Delhi", "estimated_cost_lakhs": 450.0, "emd_lakhs": 9.0,
             "tender_fee": 5000.0, "categories": ["Electrical Works", "AMC"],
             "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=21)).isoformat(),
             "contact_details": {"name": "EE Electrical CPWD", "email": "ee.elec@cpwd.gov.in"}},
        ]


class DefenceConnector(MinistryBaseConnector):
    source_id = "defence"
    display_name = "Ministry of Defence — Procurement"
    description = "Defence capital and revenue procurement notices"
    MINISTRY_NAME = "Ministry of Defence"
    MINISTRY_DEPT = "Defence Procurement Organisation"
    PORTAL_URL = "https://mod.gov.in/depts/dod/procurement-policy"
    access_limitations = "MoD detailed RFPs require registered vendor login via DRDO/DPO portal"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Procurement of Bullet Proof Vehicles for CRPF — MoD Capital Budget",
             "ministry": "Ministry of Defence", "department": "Department of Defence",
             "organisation": "Defence Procurement Organisation", "state": "Delhi",
             "estimated_cost_lakhs": 25000.0, "emd_lakhs": 500.0, "tender_fee": 100000.0,
             "categories": ["Defence", "Vehicles", "Security"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=60)).isoformat(),
             "contact_details": {"name": "Joint Secretary (Procurement) MoD", "email": "js.proc@mod.gov.in"}},
            {"title": "Supply of Night Vision Devices for Indian Army — Batch Production",
             "ministry": "Ministry of Defence", "department": "Department of Military Affairs",
             "organisation": "Army HQ", "state": "Delhi",
             "estimated_cost_lakhs": 15000.0, "emd_lakhs": 300.0, "tender_fee": 50000.0,
             "categories": ["Defence Equipment", "Optics"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
             "contact_details": {"name": "DGOS Army HQ", "email": "dgos.hq@mod.gov.in"}},
        ]


class DRDOConnector(MinistryBaseConnector):
    source_id = "drdo"
    display_name = "DRDO — Defence Research and Development Organisation"
    description = "Research equipment and materials procurement from DRDO labs"
    MINISTRY_NAME = "Ministry of Defence"
    MINISTRY_DEPT = "DRDO Headquarters"
    PORTAL_URL = "https://www.drdo.gov.in/tenders"
    access_limitations = "DRDO tender details require DRDO vendor portal login"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Supply of High Performance Computing Clusters for CAIR Bangalore",
             "ministry": "Ministry of Defence", "department": "DRDO-CAIR Bangalore",
             "organisation": "Centre for Artificial Intelligence and Robotics",
             "state": "Karnataka", "estimated_cost_lakhs": 1200.0, "emd_lakhs": 24.0,
             "tender_fee": 10000.0, "categories": ["IT Equipment", "HPC", "Research"],
             "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
             "contact_details": {"name": "Director CAIR", "email": "director.cair@drdo.gov.in"}},
            {"title": "Procurement of Environmental Test Chambers — DRDL Hyderabad",
             "ministry": "Ministry of Defence", "department": "DRDO-DRDL",
             "organisation": "Defence Research and Development Laboratory",
             "state": "Telangana", "estimated_cost_lakhs": 850.0, "emd_lakhs": 17.0,
             "tender_fee": 5000.0, "categories": ["Research Equipment", "Testing"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=25)).isoformat(),
             "contact_details": {"name": "Director DRDL", "email": "director.drdl@drdo.gov.in"}},
        ]


class BELConnector(MinistryBaseConnector):
    source_id = "bel"
    display_name = "BEL — Bharat Electronics Limited"
    description = "Defence electronics and communication systems procurement"
    MINISTRY_NAME = "Ministry of Defence"
    MINISTRY_DEPT = "BEL Bangalore Complex"
    PORTAL_URL = "https://bel-india.in/tender"
    access_limitations = "BEL vendor portal requires prior vendor registration"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Supply of Ruggedized PCB Assemblies for Electronic Warfare Systems — BEL Machilipatnam",
             "ministry": "Ministry of Defence", "department": "BEL Machilipatnam Unit",
             "organisation": "Bharat Electronics Limited", "state": "Andhra Pradesh",
             "estimated_cost_lakhs": 720.0, "emd_lakhs": 14.4, "tender_fee": 5000.0,
             "categories": ["Defence Electronics", "PCB", "Electronic Warfare"],
             "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=28)).isoformat(),
             "contact_details": {"name": "AGM Purchase BEL Machilipatnam", "email": "purchase.mcp@bel-india.in"}},
        ]


class MOFConnector(MinistryBaseConnector):
    source_id = "mof"
    display_name = "Ministry of Finance"
    description = "Financial services and IT procurement"
    MINISTRY_NAME = "Ministry of Finance"
    MINISTRY_DEPT = "Department of Economic Affairs"
    MINISTRY_STATE = "Delhi"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Supply and Implementation of Core Banking Solution — Ministry of Finance",
             "ministry": "Ministry of Finance", "department": "Department of Financial Services",
             "organisation": "Ministry of Finance", "state": "Delhi",
             "estimated_cost_lakhs": 5000.0, "emd_lakhs": 100.0, "tender_fee": 50000.0,
             "categories": ["IT Systems", "Banking", "Financial Services"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
             "contact_details": {"name": "Director IT MoF", "email": "it.mof@gov.in"}},
        ]


class MHAConnector(MinistryBaseConnector):
    source_id = "mha"
    display_name = "Ministry of Home Affairs"
    description = "Internal security and police equipment procurement"
    MINISTRY_NAME = "Ministry of Home Affairs"
    MINISTRY_DEPT = "Internal Security Division"
    MINISTRY_STATE = "Delhi"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Procurement of Anti-Drone Systems for VIP Security — MHA",
             "ministry": "Ministry of Home Affairs", "department": "Internal Security",
             "organisation": "Ministry of Home Affairs", "state": "Delhi",
             "estimated_cost_lakhs": 12000.0, "emd_lakhs": 240.0, "tender_fee": 50000.0,
             "categories": ["Security", "Anti-Drone", "Technology"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
             "contact_details": {"name": "JS Internal Security MHA", "email": "is.mha@gov.in"}},
            {"title": "Supply of Body Armour for CRPF Battalions — MHA",
             "ministry": "Ministry of Home Affairs", "department": "CRPF",
             "organisation": "Central Reserve Police Force", "state": "Delhi",
             "estimated_cost_lakhs": 8500.0, "emd_lakhs": 170.0, "tender_fee": 25000.0,
             "categories": ["Security", "Body Armour", "Police Equipment"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=40)).isoformat(),
             "contact_details": {"name": "Director General CRPF", "email": "dg.crpf@crpf.gov.in"}},
        ]


class MOEConnector(MinistryBaseConnector):
    source_id = "moe"
    display_name = "Ministry of Education"
    description = "Education infrastructure and IT procurement"
    MINISTRY_NAME = "Ministry of Education"
    MINISTRY_DEPT = "Department of School Education"
    MINISTRY_STATE = "Delhi"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Supply and Installation of Smart Classrooms — PM-POSHAN Schools 5000 Units",
             "ministry": "Ministry of Education", "department": "Department of School Education and Literacy",
             "organisation": "Ministry of Education", "state": "Delhi",
             "estimated_cost_lakhs": 22000.0, "emd_lakhs": 440.0, "tender_fee": 100000.0,
             "categories": ["Education", "Smart Classroom", "IT Equipment"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
             "contact_details": {"name": "Director DSE MoE", "email": "dse.moe@gov.in"}},
        ]


class MOHFWConnector(MinistryBaseConnector):
    source_id = "mohfw"
    display_name = "Ministry of Health and Family Welfare"
    description = "Medical equipment and hospital procurement"
    MINISTRY_NAME = "Ministry of Health and Family Welfare"
    MINISTRY_DEPT = "Health Services"
    MINISTRY_STATE = "Delhi"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Supply of MRI Machines for District Hospitals — PMBJP Scheme Phase-3",
             "ministry": "Ministry of Health and Family Welfare", "department": "National Health Mission",
             "organisation": "Ministry of Health and Family Welfare", "state": "Delhi",
             "estimated_cost_lakhs": 35000.0, "emd_lakhs": 700.0, "tender_fee": 100000.0,
             "categories": ["Medical Equipment", "Hospital", "MRI"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=45)).isoformat(),
             "contact_details": {"name": "Director Medical Procurement MoHFW", "email": "medprocurement@mohfw.gov.in"}},
            {"title": "Central Procurement of Essential Medicines — Pharmacies National List 2026",
             "ministry": "Ministry of Health and Family Welfare", "department": "Central Medical Services",
             "organisation": "CGHS", "state": "Delhi",
             "estimated_cost_lakhs": 75000.0, "emd_lakhs": 1500.0, "tender_fee": 200000.0,
             "categories": ["Pharmaceuticals", "CGHS", "Essential Medicines"], "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=60)).isoformat(),
             "contact_details": {"name": "MD CMS MoHFW", "email": "md.cms@mohfw.gov.in"}},
        ]


class MSMEConnector(MinistryBaseConnector):
    source_id = "msme"
    display_name = "Ministry of MSME"
    description = "MSME sector development and tooling procurement"
    MINISTRY_NAME = "Ministry of Micro, Small and Medium Enterprises"
    MINISTRY_DEPT = "MSME Development Office"
    MINISTRY_STATE = "Delhi"

    def _get_ministry_notices(self) -> List[dict]:
        return [
            {"title": "Supply of CNC Machine Tools for MSME Technology Centres — PAN India",
             "ministry": "Ministry of Micro, Small and Medium Enterprises",
             "department": "MSME Technology Centre Division",
             "organisation": "National Small Industries Corporation", "state": "Delhi",
             "estimated_cost_lakhs": 18000.0, "emd_lakhs": 360.0, "tender_fee": 100000.0,
             "categories": ["CNC Machines", "Manufacturing", "Technology Centre"],
             "procurement_method": "open",
             "published_at": datetime.utcnow().isoformat(),
             "submission_deadline": (datetime.utcnow() + timedelta(days=40)).isoformat(),
             "contact_details": {"name": "CMD NSIC", "email": "cmd@nsic.co.in"}},
        ]
