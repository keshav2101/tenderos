"""Search request/response models for the hybrid search service."""
from __future__ import annotations
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SearchMode(str, Enum):
    KEYWORD = "keyword"
    SEMANTIC = "semantic"
    HYBRID = "hybrid"
    NATURAL_LANGUAGE = "natural_language"


class SortField(str, Enum):
    RELEVANCE = "relevance"
    DEADLINE = "deadline"
    COST_HIGH = "cost_high"
    COST_LOW = "cost_low"
    PUBLISHED = "published"
    MATCH_SCORE = "match_score"


class SearchFilters(BaseModel):
    states: List[str] = Field(default_factory=list)
    ministries: List[str] = Field(default_factory=list)
    departments: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    cost_min_lakhs: Optional[float] = None
    cost_max_lakhs: Optional[float] = None
    emd_max_lakhs: Optional[float] = None
    deadline_from: Optional[str] = None  # ISO date
    deadline_to: Optional[str] = None
    published_from: Optional[str] = None
    status: Optional[str] = None
    procurement_method: Optional[str] = None
    msme_eligible: Optional[bool] = None
    startup_eligible: Optional[bool] = None
    source: Optional[str] = None


class SearchQuery(BaseModel):
    query: str
    mode: SearchMode = SearchMode.HYBRID
    filters: SearchFilters = Field(default_factory=SearchFilters)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: SortField = SortField.RELEVANCE
    company_id: Optional[UUID] = None  # If provided, include match scores


class TenderSearchHit(BaseModel):
    tender_id: str
    title: str
    ministry: Optional[str]
    department: Optional[str]
    organisation: Optional[str]
    state: Optional[str]
    categories: List[str]
    estimated_cost_lakhs: Optional[float]
    emd_lakhs: Optional[float]
    submission_deadline: Optional[str]
    status: str
    msme_eligible: bool
    source: str
    relevance_score: float
    match_score: Optional[int] = None  # Company-tender match (0-100)
    ai_summary: Optional[str] = None
    highlights: Dict[str, List[str]] = Field(default_factory=dict)


class SearchResult(BaseModel):
    hits: List[TenderSearchHit]
    total: int
    page: int
    page_size: int
    total_pages: int
    query_time_ms: int
    search_mode_used: SearchMode
    facets: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
