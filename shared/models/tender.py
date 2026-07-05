"""
Core Tender models — the canonical data schema for TenderOS.
Every tender from every source is normalized to this structure.
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, HttpUrl, validator


class TenderStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    AWARDED = "awarded"
    CANCELLED = "cancelled"
    CORRIGENDUM = "corrigendum"
    UPCOMING = "upcoming"


class ProcurementMethod(str, Enum):
    OPEN = "open"
    LIMITED = "limited"
    SINGLE = "single"
    EMERGENCY = "emergency"
    GEM = "gem"
    E_TENDERING = "e-tendering"
    RATE_CONTRACT = "rate_contract"
    EXPRESSION_OF_INTEREST = "eoi"


class TenderCategory(str, Enum):
    CONSTRUCTION = "Construction"
    IT = "IT"
    AI = "AI"
    CYBERSECURITY = "Cybersecurity"
    HEALTHCARE = "Healthcare"
    MEDICAL_EQUIPMENT = "Medical Equipment"
    EDUCATION = "Education"
    TRANSPORT = "Transport"
    AGRICULTURE = "Agriculture"
    RENEWABLE_ENERGY = "Renewable Energy"
    POWER = "Power"
    TELECOMMUNICATIONS = "Telecommunications"
    DEFENCE = "Defence"
    RESEARCH = "Research"
    MANUFACTURING = "Manufacturing"
    ELECTRONICS = "Electronics"
    CIVIL_ENGINEERING = "Civil Engineering"
    CONSULTANCY = "Consultancy"
    CLEANING = "Cleaning"
    FACILITY_MANAGEMENT = "Facility Management"
    OFFICE_SUPPLIES = "Office Supplies"
    CLOUD = "Cloud"
    DATA_ANALYTICS = "Data Analytics"
    ROBOTICS = "Robotics"
    IOT = "IoT"
    SMART_CITY = "Smart City"
    DRONE = "Drone"
    GIS = "GIS"
    MACHINE_LEARNING = "Machine Learning"
    OTHER = "Other"


class DocumentType(str, Enum):
    NOTICE = "notice"
    CORRIGENDUM = "corrigendum"
    BOQ = "boq"
    ANNEXURE = "annexure"
    TECHNICAL_SPEC = "technical_spec"
    FINANCIAL = "financial"
    NIT = "nit"
    TENDER_FORM = "tender_form"
    OTHER = "other"


class ExtractionTier(int, Enum):
    RULE_BASED = 1
    SMALL_LLM = 2
    CLOUD_LLM = 3


class TenderTimeline(BaseModel):
    published: Optional[datetime] = None
    document_download_start: Optional[datetime] = None
    document_download_end: Optional[datetime] = None
    bid_submission_start: Optional[datetime] = None
    submission_deadline: Optional[datetime] = None
    opening_date: Optional[datetime] = None
    bid_validity_days: Optional[int] = None
    work_completion_days: Optional[int] = None


class EligibilityRequirement(BaseModel):
    turnover_min_lakhs: Optional[float] = None  # In Lakhs INR
    experience_years: Optional[int] = None
    similar_works_required: Optional[int] = None
    similar_works_min_value_lakhs: Optional[float] = None
    certifications: List[str] = Field(default_factory=list)
    registrations: List[str] = Field(default_factory=list)
    msme_eligible: bool = False
    startup_eligible: bool = False
    gem_registered_required: bool = False
    local_vendor_preference: Optional[str] = None
    raw_text: Optional[str] = None  # Original eligibility clause text


class BOQItem(BaseModel):
    sno: Optional[str] = None
    description: str
    unit: Optional[str] = None
    quantity: Optional[float] = None
    unit_rate: Optional[float] = None
    amount: Optional[float] = None


class ContactDetail(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class TenderDocument(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tender_id: UUID
    doc_type: DocumentType
    filename: str
    storage_path: str  # MinIO path
    source_url: Optional[str] = None
    file_hash: Optional[str] = None  # SHA256
    file_size_bytes: Optional[int] = None
    page_count: Optional[int] = None
    ocr_status: str = "pending"  # pending | processing | done | failed
    layout_status: str = "pending"
    extraction_status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TenderAward(BaseModel):
    tender_id: UUID
    winner_name: Optional[str] = None
    winner_gstin: Optional[str] = None
    winner_gem_id: Optional[str] = None
    awarded_amount_lakhs: Optional[float] = None
    estimated_amount_lakhs: Optional[float] = None
    discount_pct: Optional[float] = None
    awarded_at: Optional[datetime] = None
    source: str = "public"
    source_url: Optional[str] = None
    is_verified: bool = False


class Corrigendum(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tender_id: UUID
    published_at: Optional[datetime] = None
    summary: Optional[str] = None
    changed_fields: List[str] = Field(default_factory=list)
    documents: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Tender(BaseModel):
    # Identity
    id: UUID = Field(default_factory=uuid4)
    source: str  # gem | cppp | maharashtra | etc.
    source_tender_id: str
    source_url: Optional[str] = None
    version: int = 1

    # Core fields
    title: str
    ministry: Optional[str] = None
    department: Optional[str] = None
    organisation: Optional[str] = None
    organisation_type: Optional[str] = None  # PSU | Govt | Smart City | etc.

    # Geography
    state: Optional[str] = None
    district: Optional[str] = None
    location: Optional[str] = None

    # Financial
    estimated_cost_lakhs: Optional[float] = None
    emd_lakhs: Optional[float] = None
    tender_fee: Optional[float] = None
    performance_guarantee_pct: Optional[float] = None

    # Classification
    categories: List[str] = Field(default_factory=list)
    procurement_method: Optional[ProcurementMethod] = None
    status: TenderStatus = TenderStatus.ACTIVE

    # Structured sub-objects
    timeline: TenderTimeline = Field(default_factory=TenderTimeline)
    eligibility: EligibilityRequirement = Field(default_factory=EligibilityRequirement)
    boq: List[BOQItem] = Field(default_factory=list)
    contact: Optional[ContactDetail] = None

    # Documents
    documents: List[TenderDocument] = Field(default_factory=list)
    corrigendum_count: int = 0

    # AI Extraction metadata
    extraction_tier: ExtractionTier = ExtractionTier.RULE_BASED
    extraction_confidence: float = 0.0
    ai_summary: Optional[str] = None
    key_points: List[str] = Field(default_factory=list)

    # Vector embeddings (stored separately in Qdrant, reference here)
    embedding_id: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced_at: Optional[datetime] = None

    class Config:
        use_enum_values = True
        json_encoders = {datetime: lambda v: v.isoformat(), UUID: lambda v: str(v)}

    @property
    def estimated_cost_crores(self) -> Optional[float]:
        if self.estimated_cost_lakhs:
            return self.estimated_cost_lakhs / 100
        return None

    @property
    def days_until_deadline(self) -> Optional[int]:
        if self.timeline.submission_deadline:
            delta = self.timeline.submission_deadline - datetime.utcnow()
            return max(0, delta.days)
        return None

    @property
    def is_msme_friendly(self) -> bool:
        return self.eligibility.msme_eligible

    def to_search_document(self) -> Dict[str, Any]:
        """Flatten for OpenSearch indexing."""
        return {
            "id": str(self.id),
            "title": self.title,
            "ministry": self.ministry,
            "department": self.department,
            "organisation": self.organisation,
            "state": self.state,
            "district": self.district,
            "categories": self.categories,
            "estimated_cost_lakhs": self.estimated_cost_lakhs,
            "emd_lakhs": self.emd_lakhs,
            "status": self.status,
            "submission_deadline": (
                self.timeline.submission_deadline.isoformat()
                if self.timeline.submission_deadline else None
            ),
            "published": (
                self.timeline.published.isoformat()
                if self.timeline.published else None
            ),
            "msme_eligible": self.eligibility.msme_eligible,
            "procurement_method": self.procurement_method,
            "ai_summary": self.ai_summary,
            "source": self.source,
        }
