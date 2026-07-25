"""
Base class definition and helper validation utilities for Custom Connector SDK.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class SDKTenderSchema(BaseModel):
    """Normalized schema required for SDK connectors to validate against."""

    tender_id: str = Field(..., description="Unique ID on source portal")
    title: str = Field(..., description="Title of the tender")
    source_url: HttpUrl = Field(..., description="Direct link to tender details")
    ministry: str | None = None
    department: str | None = None
    estimated_cost_lakhs: float | None = None
    emd_lakhs: float | None = None
    submission_deadline: datetime
    categories: list[str] = []
    ai_summary: str | None = None


class BaseSDKConnector(ABC):
    """Base class that custom enterprise connectors must inherit from."""

    @property
    @abstractmethod
    def source_id(self) -> str:
        """Name of the portal source (e.g. 'custom_portal_xyz')"""

    @abstractmethod
    async def fetch_tenders(self, since: datetime) -> list[dict[str, Any]]:
        """Fetch raw tenders from target portal since a given datetime."""

    def validate_tender(self, raw_tender_dict: dict[str, Any]) -> SDKTenderSchema:
        """Helper to validate raw tender records against our standard schema."""
        return SDKTenderSchema(**raw_tender_dict)
