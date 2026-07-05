"""
Data Normalization Layer — standardizes raw tenders from various sources
into the unified TenderOS schema.
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

class NormalizedTender(BaseModel):
    tender_id: str
    title: str
    ministry: str
    department: str
    organisation: str
    buyer: str
    location: str
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

def normalize_state(raw_state: str) -> str:
    """Normalize state string to standard list."""
    if not raw_state:
        return "Delhi"
    raw_clean = raw_state.strip().title()
    for state in INDIAN_STATES:
        if state.lower() in raw_clean.lower():
            return state
    return "Delhi"

def normalize_tender(raw: RawTender) -> NormalizedTender:
    """
    Normalizes a RawTender based on its source portal.
    Generates strict data lineage context.
    """
    source_id = raw.source_id
    raw_data = raw.raw_json or {}
    now = datetime.utcnow()

    # Calculate raw payload hash for lineage
    raw_str = str(raw_data) or raw.raw_html or ""
    payload_hash = hashlib.sha256(raw_str.encode()).hexdigest()

    # 1. Base fields initialization
    title = ""
    ministry = "Other"
    department = "Other"
    organisation = "Other"
    buyer = "Other"
    location = "Delhi"
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

    # 2. Source-specific parsing
    if source_id == "gem":
        title = raw_data.get("b_category_name", ["Live GeM Bid"])[0]
        ministry = raw_data.get("ba_official_details_minName", ["Ministry of Defence"])[0]
        department = raw_data.get("ba_official_details_deptName", ["Department of Military Affairs"])[0]
        organisation = department
        buyer = raw_data.get("ba_official_details_officeName", [department])[0]
        
        # State normalization based on department name or title
        location = normalize_state(department)
        
        qty = raw_data.get("b_total_quantity", [1])[0]
        try:
            cost_lakhs = float(qty) * 12.5  # Approximate value estimation for bids
        except Exception:
            cost_lakhs = 12.5
        emd = cost_lakhs * 0.02
        fee = 0.0
        categories = raw_data.get("b_category_name", [])
        procurement_method = "gem"
        
        published_str = raw_data.get("final_start_date_sort", [None])[0]
        deadline_str = raw_data.get("final_end_date_sort", [None])[0]
        
        if published_str:
            published = datetime.fromisoformat(published_str.replace("Z", "+00:00")).replace(tzinfo=None)
        if deadline_str:
            deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00")).replace(tzinfo=None)
            
        contact_details = {
            "email": raw_data.get("ba_official_details_email", ["contact@gem.gov.in"])[0],
            "phone": "",
            "name": raw_data.get("ba_official_details_name", ["GeM Buyer"])[0],
            "designation": raw_data.get("ba_official_details_desg", ["Buyer"])[0]
        }

    else:
        # CPPP / Railways / State Portals / PSU normalization
        title = raw_data.get("title", "Government Procurement Notice")
        ministry = raw_data.get("ministry", "Other Ministries")
        department = raw_data.get("department", "Other Departments")
        organisation = raw_data.get("organisation", department)
        buyer = raw_data.get("buyer", organisation)
        location = normalize_state(raw_data.get("state", "Delhi"))
        
        cost_lakhs = float(raw_data.get("estimated_cost_lakhs") or 0.0)
        emd = float(raw_data.get("emd_lakhs") or 0.0)
        fee = float(raw_data.get("tender_fee") or 0.0)
        categories = raw_data.get("categories", ["General"])
        procurement_method = raw_data.get("procurement_method", "open")
        
        if raw_data.get("published_at"):
            published = datetime.fromisoformat(raw_data["published_at"])
        if raw_data.get("submission_deadline"):
            deadline = datetime.fromisoformat(raw_data["submission_deadline"])
            
        contact_details = raw_data.get("contact_details", {
            "email": "procurement@eprocure.gov.in",
            "name": "Procurement Officer"
        })

    opening = deadline + timedelta(days=1)

    # Standardize string capitalization
    title = title.strip()
    ministry = ministry.strip().title()
    department = department.strip()
    organisation = organisation.strip()
    buyer = buyer.strip()

    # Data lineage tracking parameters
    lineage = {
        "original_source_portal": source_id,
        "original_url": raw.source_url,
        "original_payload_hash": payload_hash,
        "crawl_timestamp": raw.fetched_at.isoformat(),
        "connector_version": "2.1.0",
        "parser_version": "2.1.0",
        "normalization_version": "1.0.0",
        "ocr_version": "1.0.0" if document_urls else None,
        "embedding_model_version": "all-MiniLM-L6-v2"
    }

    return NormalizedTender(
        tender_id=raw.source_tender_id,
        title=title,
        ministry=ministry,
        department=department,
        organisation=organisation,
        buyer=buyer,
        location=location,
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
        lineage=lineage
    )
