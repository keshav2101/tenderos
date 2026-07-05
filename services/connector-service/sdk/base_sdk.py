"""
Base class definition and helper validation utilities for Custom Connector SDK.
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, HttpUrl, Field


class SDKTenderSchema(BaseModel):
    """Normalized schema required for SDK connectors to validate against."""
    tender_id: str = Field(..., description="Unique ID on source portal")
    title: str = Field(..., description="Title of the tender")
    source_url: HttpUrl = Field(..., description="Direct link to tender details")
    ministry: Optional[str] = None
    department: Optional[str] = None
    estimated_cost_lakhs: Optional[float] = None
    emd_lakhs: Optional[float] = None
    submission_deadline: datetime
    categories: List[str] = []
    ai_summary: Optional[str] = None


class BaseSDKConnector(ABC):
    """Base class that custom enterprise connectors must inherit from."""
    
    @property
    @abstractmethod
    def source_id(self) -> str:
        """Name of the portal source (e.g. 'custom_portal_xyz')"""
        pass

    @abstractmethod
    async def fetch_tenders(self, since: datetime) -> List[Dict[str, Any]]:
        """Fetch raw tenders from target portal since a given datetime."""
        pass

    def validate_tender(self, raw_tender_dict: Dict[str, Any]) -> SDKTenderSchema:
        """Helper to validate raw tender records against our standard schema."""
        return SDKTenderSchema(**raw_tender_dict)
