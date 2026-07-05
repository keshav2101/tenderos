"""Bid Qualification Engine models."""
from __future__ import annotations
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from pydantic import BaseModel, Field


class CheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    PARTIAL = "PARTIAL"
    EXEMPT = "EXEMPT"
    UNKNOWN = "UNKNOWN"


class BidRecommendation(str, Enum):
    BID = "BID"
    CONDITIONAL_BID = "CONDITIONAL_BID"
    SKIP = "SKIP"
    REVIEW = "REVIEW"


class GapItem(BaseModel):
    field: str
    required: Optional[str] = None
    company_has: Optional[str] = None
    gap: Optional[str] = None
    severity: str = "medium"  # low | medium | high | critical


class EligibilityCheck(BaseModel):
    turnover_check: CheckStatus = CheckStatus.UNKNOWN
    turnover_required_lakhs: Optional[float] = None
    turnover_company_lakhs: Optional[float] = None
    turnover_gap_lakhs: Optional[float] = None

    experience_check: CheckStatus = CheckStatus.UNKNOWN
    experience_required_years: Optional[int] = None
    experience_company_years: Optional[float] = None

    certification_check: CheckStatus = CheckStatus.UNKNOWN
    certifications_required: List[str] = Field(default_factory=list)
    certifications_present: List[str] = Field(default_factory=list)
    certifications_missing: List[str] = Field(default_factory=list)

    registration_check: CheckStatus = CheckStatus.UNKNOWN
    registrations_required: List[str] = Field(default_factory=list)
    registrations_present: List[str] = Field(default_factory=list)
    registrations_missing: List[str] = Field(default_factory=list)

    emd_status: str = "REQUIRED"  # REQUIRED | EXEMPT_MSME | EXEMPT_STARTUP | WAIVED
    geographic_check: CheckStatus = CheckStatus.UNKNOWN
    msme_benefit_applicable: bool = False


class GapAnalysis(BaseModel):
    critical_gaps: List[GapItem] = Field(default_factory=list)
    medium_gaps: List[GapItem] = Field(default_factory=list)
    low_gaps: List[GapItem] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)
    total_gaps: int = 0

    @property
    def can_address_gaps(self) -> bool:
        return len(self.critical_gaps) == 0


class BidQualification(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    company_id: UUID
    tender_id: UUID

    # Scores
    match_score: int = Field(ge=0, le=100)  # Category + domain match
    eligibility_score: int = Field(ge=0, le=100)  # All eligibility checks
    winning_probability: Optional[int] = Field(default=None, ge=0, le=100)
    confidence: str = "LOW"  # LOW | MEDIUM | HIGH

    # Detailed checks
    eligible: bool = False
    eligibility_check: EligibilityCheck = Field(default_factory=EligibilityCheck)
    gap_analysis: GapAnalysis = Field(default_factory=GapAnalysis)

    # Actionable output
    recommendation: BidRecommendation = BidRecommendation.REVIEW
    recommendation_reason: Optional[str] = None
    estimated_prep_hours: Optional[int] = None
    key_risks: List[str] = Field(default_factory=list)
    advantages: List[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True
        json_encoders = {datetime: lambda v: v.isoformat(), UUID: lambda v: str(v)}
