"""User and authentication models."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    ENTERPRISE = "enterprise"
    SME = "sme"
    CONSULTANT = "consultant"
    VIEWER = "viewer"


class UserPlan(str, Enum):
    FREE = "free"
    SME = "sme"
    ENTERPRISE = "enterprise"
    API = "api"


class User(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    email: str
    name: Optional[str] = None
    role: UserRole = UserRole.VIEWER
    plan: UserPlan = UserPlan.FREE
    is_active: bool = True
    is_verified: bool = False
    company_id: Optional[UUID] = None
    google_id: Optional[str] = None
    microsoft_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None

    class Config:
        use_enum_values = True
        json_encoders = {datetime: lambda v: v.isoformat(), UUID: lambda v: str(v)}


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


class APIKey(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    name: str
    key_prefix: str  # First 8 chars shown to user
    key_hash: str    # Bcrypt hash stored
    plan: UserPlan = UserPlan.SME
    daily_limit: int = 10000
    usage_today: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat(), UUID: lambda v: str(v)}
