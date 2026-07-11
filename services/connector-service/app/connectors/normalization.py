"""
Data Normalization Layer — Phase 14 expanded.

Standardizes raw tenders from 80+ sources into the unified TenderOS schema.
Supports GeM, CPPP, Railways, all PSUs, all Ministries, all 36 State/UT portals.
"""
from __future__ import annotations
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
import structlog
from app.connectors.base import RawTender

logger = structlog.get_logger()

# Standard Indian states list for location normalization
INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

# Source ID groups for routing normalization logic
GEM_SOURCES = {"gem"}
CPPP_SOURCES = {"cppp", "eprocure"}
RAILWAYS_SOURCES = {"railways", "ireps"}

# All PSU and Central Gov sources that use the generic normalizer
GENERIC_SOURCES = {
    "bhel", "ntpc", "ongc", "npcil", "gail", "coal_india", "sail",
    "aai", "nhai", "isro", "hal", "iocl", "bpcl",
    "cpwd", "defence", "drdo", "bel",
    "mof", "mha", "moe", "mohfw", "msme",
    "psu",  # legacy
}

# State/UT source IDs
STATE_SOURCES = {
    "ap", "ar", "as", "br", "cg", "ga", "gj", "hr", "hp", "jh",
    "ka", "kl", "mp", "mh", "mn", "ml", "mz", "nl", "od", "pb",
    "rj", "sk", "tn", "ts", "tr", "up", "uk", "wb",
    # UTs
    "an", "ch", "dd", "dl", "jk", "la", "ld", "py",
    # legacy state connector
    "state_procurement",
}


class NormalizedTender(BaseModel):
    tender_id: str
    title: str
    ministry: str
    department: str
    organisation: str
    buyer: str
    location: str
    district: Optional[str] = None
    procurement_type: Optional[str] = None
    bid_type: Optional[str] = None
    currency: str = "INR"
    tender_status: str = "active"
    estimated_cost_lakhs: Optional[float] = None
    emd_lakhs: Optional[float] = None
    tender_fee: Optional[float] = None
    categories: List[str] = Field(default_factory=list)
    procurement_method: str
    published_at: datetime
    submission_deadline: datetime
    opening_date: Optional[datetime] = None
    source_portal: str
    document_urls: List[str] = Field(default_factory=list)
    contact_details: Dict[str, Any] = Field(default_factory=dict)
    lineage: Dict[str, Any] = Field(default_factory=dict)
    corrigenda: List[Dict[str, Any]] = Field(default_factory=list)
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)


def normalize_state(raw_state: str) -> str:
    """Normalize state string to standard list."""
    if not raw_state:
        return "Delhi"
    raw_clean = raw_state.strip().title()
    for state in INDIAN_STATES:
        if state.lower() in raw_clean.lower():
            return state
    return "Delhi"


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def _safe_datetime(val: Any, default: Optional[datetime] = None) -> Optional[datetime]:
    if not val:
        return default
    if isinstance(val, datetime):
        return val
    try:
        s = str(val).replace("Z", "+00:00")
        return datetime.fromisoformat(s).replace(tzinfo=None)
    except Exception:
        return default


def normalize_tender(raw: RawTender) -> NormalizedTender:
    """
    Normalizes a RawTender based on its source portal.
    Generates strict data lineage context.
    Phase 14: Supports 80+ source_ids with unified routing.
    """
    source_id = raw.source_id
    raw_data = raw.raw_json or {}
    now = datetime.utcnow()

    # Calculate raw payload hash for lineage
    raw_str = str(raw_data) or raw.raw_html or ""
    payload_hash = hashlib.sha256(raw_str.encode()).hexdigest()

    # Default values
    title = ""
    ministry = "Other"
    department = "Other"
    organisation = "Other"
    buyer = "Other"
    location = "Delhi"
    district = None
    procurement_type = None
    bid_type = None
    cost_lakhs = 0.0
    emd = 0.0
    fee = 0.0
    categories = []
    procurement_method = "open"
    published = now
    deadline = now + timedelta(days=14)
    opening = None
    document_urls = raw.document_urls or []
    contact_details = {}

    # ── GeM ───────────────────────────────────────────────────────────────────
    if source_id in GEM_SOURCES:
        title = raw_data.get("b_category_name", ["Live GeM Bid"])[0]
        ministry = raw_data.get("ba_official_details_minName", ["Ministry of Defence"])[0]
        department = raw_data.get("ba_official_details_deptName", ["Department of Military Affairs"])[0]
        organisation = department
        buyer = raw_data.get("ba_official_details_officeName", [department])[0]
        location = normalize_state(department)
        qty = raw_data.get("b_total_quantity", [1])[0]
        cost_lakhs = _safe_float(qty) * 12.5
        emd = cost_lakhs * 0.02
        fee = 0.0
        categories = raw_data.get("b_category_name", [])
        procurement_method = "gem"
        bid_type = "forward_auction"
        procurement_type = "goods"
        published = _safe_datetime(
            raw_data.get("final_start_date_sort", [None])[0], published)
        deadline = _safe_datetime(
            raw_data.get("final_end_date_sort", [None])[0], deadline)
        contact_details = {
            "email": raw_data.get("ba_official_details_email", ["contact@gem.gov.in"])[0],
            "phone": "",
            "name": raw_data.get("ba_official_details_name", ["GeM Buyer"])[0],
            "designation": raw_data.get("ba_official_details_desg", ["Buyer"])[0],
        }

    # ── CPPP / eProcure (RSS-based) ────────────────────────────────────────
    elif source_id in CPPP_SOURCES:
        title = raw_data.get("title", "Government Procurement Notice")
        ministry = raw_data.get("ministry", "Central Government")
        department = raw_data.get("department", "NIC")
        organisation = raw_data.get("organisation", "eProcure")
        buyer = organisation
        location = normalize_state(raw_data.get("state", "Delhi"))
        cost_lakhs = _safe_float(raw_data.get("estimated_cost_lakhs"), 0.0)
        emd = _safe_float(raw_data.get("emd_lakhs"), 0.0)
        fee = _safe_float(raw_data.get("tender_fee"), 0.0)
        categories = raw_data.get("categories", ["General"])
        procurement_method = "open"
        procurement_type = "works"
        published = _safe_datetime(raw_data.get("published_at"), published)
        deadline = _safe_datetime(raw_data.get("submission_deadline"), deadline)
        contact_details = raw_data.get("contact_details", {
            "email": "procurement@eprocure.gov.in",
            "name": "Procurement Officer",
        })

    # ── Railways / IREPS ───────────────────────────────────────────────────
    elif source_id in RAILWAYS_SOURCES:
        title = raw_data.get("title", "Railway Procurement Notice")
        ministry = "Ministry of Railways"
        department = raw_data.get("division", "Indian Railways")
        organisation = raw_data.get("zone", "Indian Railways")
        buyer = department
        location = normalize_state(raw_data.get("state", "Delhi"))
        cost_lakhs = _safe_float(raw_data.get("estimated_cost_lakhs"), 0.0)
        emd = _safe_float(raw_data.get("emd_lakhs"), 0.0)
        fee = _safe_float(raw_data.get("tender_fee"), 0.0)
        categories = raw_data.get("categories", ["Railway Works"])
        procurement_method = raw_data.get("procurement_method", "open")
        procurement_type = "works"
        published = _safe_datetime(raw_data.get("published_at"), published)
        deadline = _safe_datetime(raw_data.get("submission_deadline"), deadline)
        contact_details = raw_data.get("contact_details", {
            "email": "procurement@ireps.gov.in",
            "name": "Purchase Officer",
        })

    # ── Generic: All PSUs, Ministries, State Portals ──────────────────────
    else:
        title = raw_data.get("title", "Government Procurement Notice")
        ministry = raw_data.get("ministry", "Other Ministries")
        department = raw_data.get("department", "Other Departments")
        organisation = raw_data.get("organisation", department)
        buyer = raw_data.get("buyer", organisation)
        location = normalize_state(raw_data.get("state", "Delhi"))
        district = raw_data.get("district")
        cost_lakhs = _safe_float(raw_data.get("estimated_cost_lakhs"), 0.0)
        emd = _safe_float(raw_data.get("emd_lakhs"), 0.0)
        fee = _safe_float(raw_data.get("tender_fee"), 0.0)
        categories = raw_data.get("categories", ["General"])
        procurement_method = raw_data.get("procurement_method", "open")
        procurement_type = raw_data.get("procurement_type", "works")
        bid_type = raw_data.get("bid_type")
        published = _safe_datetime(raw_data.get("published_at"), published)
        deadline = _safe_datetime(raw_data.get("submission_deadline"), deadline)
        contact_details = raw_data.get("contact_details", {
            "email": "procurement@eprocure.gov.in",
            "name": "Procurement Officer",
        })

    opening = deadline + timedelta(days=1)

    # Standardize string capitalization
    title = title.strip()
    ministry = ministry.strip().title()
    department = department.strip()
    organisation = organisation.strip()
    buyer = buyer.strip()

    # Data lineage
    lineage = {
        "original_source_portal": source_id,
        "original_url": raw.source_url,
        "original_payload_hash": payload_hash,
        "crawl_timestamp": raw.fetched_at.isoformat(),
        "connector_version": "14.0.0",
        "parser_version": "14.0.0",
        "normalization_version": "2.0.0",
        "ocr_version": "1.0.0" if document_urls else None,
        "embedding_model_version": "all-MiniLM-L6-v2",
    }

    return NormalizedTender(
        tender_id=raw.source_tender_id,
        title=title,
        ministry=ministry,
        department=department,
        organisation=organisation,
        buyer=buyer,
        location=location,
        district=district,
        procurement_type=procurement_type,
        bid_type=bid_type,
        currency="INR",
        tender_status="active",
        estimated_cost_lakhs=cost_lakhs,
        emd_lakhs=emd,
        tender_fee=fee,
        categories=categories,
        procurement_method=procurement_method,
        published_at=published,
        submission_deadline=deadline,
        opening_date=opening,
        source_portal=source_id,
        document_urls=document_urls,
        contact_details=contact_details,
        lineage=lineage,
        raw_metadata=raw_data,
    )
