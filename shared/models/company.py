"""
Company Digital Twin models — the procurement profile for each organization.
"""
from __future__ import annotations
from datetime import datetime, date
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator


class EntityType(str, Enum):
    MSME_MICRO = "MSME_Micro"
    MSME_SMALL = "MSME_Small"
    MSME_MEDIUM = "MSME_Medium"
    STARTUP = "Startup"
    LARGE = "Large"
    MNC = "MNC"
    NGO = "NGO"
    ACADEMIC = "Academic"
    PSU = "PSU"


class DocumentVerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class CompanyTurnover(BaseModel):
    year: int  # Financial year end (e.g., 2023 = FY2022-23)
    value_lakhs: float
    auditor_name: Optional[str] = None
    certificate_path: Optional[str] = None
    verification_status: DocumentVerificationStatus = DocumentVerificationStatus.PENDING


class CompanyExperience(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    client_name: str
    project_name: Optional[str] = None
    value_lakhs: Optional[float] = None
    domain: Optional[str] = None  # maps to TenderCategory
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_government: bool = False
    certificate_path: Optional[str] = None
    verification_status: DocumentVerificationStatus = DocumentVerificationStatus.PENDING

    @property
    def duration_months(self) -> Optional[int]:
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            return max(0, delta.days // 30)
        return None


class CompanyCertification(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    standard: str  # e.g., "ISO 9001", "ISO 27001", "CMMI Level 3"
    scope: Optional[str] = None
    certifying_body: Optional[str] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    certificate_path: Optional[str] = None
    verification_status: DocumentVerificationStatus = DocumentVerificationStatus.PENDING

    @property
    def is_valid(self) -> bool:
        if self.valid_until:
            return self.valid_until >= date.today()
        return True  # No expiry known → assume valid


class CompanyRegistration(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    registration_type: str  # GeM | MSME/Udyam | NSIC | DPIIT | Startup India | etc.
    registration_number: str
    valid_until: Optional[date] = None
    certificate_path: Optional[str] = None
    verification_status: DocumentVerificationStatus = DocumentVerificationStatus.PENDING


class CompanyProfile(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID

    # Identity
    legal_name: str
    trade_name: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None  # Company Incorporation Number
    entity_type: Optional[EntityType] = None

    # Size
    employees: Optional[int] = None
    founded_year: Optional[int] = None

    # Location
    registered_address: Optional[str] = None
    states_active: List[str] = Field(default_factory=list)  # States of operation
    cities_active: List[str] = Field(default_factory=list)

    # Business
    products_services: List[str] = Field(default_factory=list)
    target_categories: List[str] = Field(default_factory=list)  # TenderCategory values
    primary_domain: Optional[str] = None

    # Financial history
    turnover: List[CompanyTurnover] = Field(default_factory=list)

    # Experience
    experience: List[CompanyExperience] = Field(default_factory=list)

    # Certifications + Registrations
    certifications: List[CompanyCertification] = Field(default_factory=list)
    registrations: List[CompanyRegistration] = Field(default_factory=list)

    # Profile completeness
    profile_score: float = 0.0  # 0-100 completeness score
    is_verified: bool = False

    # Vector embedding (stored in Qdrant, id referenced here)
    embedding_id: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def max_turnover_lakhs(self) -> Optional[float]:
        if self.turnover:
            return max(t.value_lakhs for t in self.turnover)
        return None

    @property
    def avg_turnover_3yr_lakhs(self) -> Optional[float]:
        if len(self.turnover) >= 1:
            recent = sorted(self.turnover, key=lambda t: t.year, reverse=True)[:3]
            return sum(t.value_lakhs for t in recent) / len(recent)
        return None

    @property
    def total_experience_years(self) -> float:
        if not self.experience:
            return 0.0
        # Use earliest start date
        start_dates = [e.start_date for e in self.experience if e.start_date]
        if not start_dates:
            return 0.0
        earliest = min(start_dates)
        delta = date.today() - earliest
        return round(delta.days / 365.25, 1)

    @property
    def is_msme(self) -> bool:
        return self.entity_type in [
            EntityType.MSME_MICRO, EntityType.MSME_SMALL, EntityType.MSME_MEDIUM
        ]

    @property
    def is_startup(self) -> bool:
        return self.entity_type == EntityType.Startup

    @property
    def gem_registered(self) -> bool:
        return any(r.registration_type == "GeM" for r in self.registrations)

    def compute_profile_score(self) -> float:
        """Compute 0-100 completeness score for the company profile."""
        score = 0.0
        if self.gstin: score += 10
        if self.pan: score += 5
        if self.entity_type: score += 5
        if self.employees: score += 5
        if self.states_active: score += 5
        if self.products_services: score += 10
        if self.turnover: score += 15
        if self.experience: score += 20
        if self.certifications: score += 15
        if self.registrations: score += 10
        return score

    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class Company(BaseModel):
    """Lightweight company record for the users table."""
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    legal_name: str
    gstin: Optional[str] = None
    entity_type: Optional[EntityType] = None
    profile_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), UUID: lambda v: str(v)}
