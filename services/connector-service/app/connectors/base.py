"""
Base Connector Interface — all data source connectors implement this.

Plugin architecture: drop a new connector file into connectors/plugins/
and register it in the connector registry. No core changes required.
"""
from __future__ import annotations
import hashlib
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, AsyncIterator, Dict, List, Optional

import structlog

logger = structlog.get_logger()


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


@dataclass
class RetryPolicy:
    max_attempts: int = 3
    backoff_base: float = 2.0          # Exponential backoff multiplier
    max_backoff_seconds: float = 300.0
    retry_on_status: List[int] = field(default_factory=lambda: [429, 500, 502, 503, 504])


@dataclass
class CadenceConfig:
    """Per-portal crawl cadence."""
    cron: str                     # cron expression
    min_interval_seconds: int     # Minimum between syncs
    description: str = ""


@dataclass
class RateLimitConfig:
    requests_per_second: float = 1.0
    burst: int = 5


@dataclass
class RawTender:
    """Minimal tender data from a source before AI extraction."""
    source_id: str
    source_tender_id: str
    source_url: str
    raw_html: Optional[str] = None
    raw_json: Optional[dict] = None
    document_urls: List[str] = field(default_factory=list)
    fetched_at: datetime = field(default_factory=datetime.utcnow)

    def content_hash(self) -> str:
        content = (self.raw_html or "") + str(self.raw_json or "")
        return hashlib.sha256(content.encode()).hexdigest()


class BaseConnector(ABC):
    """
    Abstract base class for all source connectors.
    Each connector is responsible for one procurement data source.
    """
    source_id: str
    display_name: str
    description: str
    cadence: CadenceConfig
    rate_limit: RateLimitConfig
    retry_policy: RetryPolicy
    timeout_seconds: int = 30

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self._logger = structlog.get_logger().bind(connector=self.source_id)

    @abstractmethod
    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        """
        Yield raw tenders from the source.
        `since` is the last successful sync timestamp for incremental sync.
        Must respect rate limits and never bypass authentication barriers.
        """
        ...

    @abstractmethod
    async def health_check(self) -> HealthStatus:
        """Return the health status of the source portal."""
        ...

    def get_dom_fingerprint(self, html: str) -> str:
        """
        Compute a fingerprint of the listing page structure.
        Used for change detection — if fingerprint unchanged, skip detailed fetch.
        """
        import re
        # Extract structural elements only (tags + classes), ignore content
        structural = re.sub(r'>([^<]+)<', '><', html)
        structural = re.sub(r'\s+', ' ', structural)
        return hashlib.md5(structural.encode()).hexdigest()

    async def is_accessible(self) -> bool:
        """Check if the source portal is reachable."""
        import httpx
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.head(self._base_url())
                return resp.status_code < 500
        except Exception:
            return False

    def _base_url(self) -> str:
        return self.config.get("base_url", "")

    def log_info(self, msg: str, **kwargs):
        self._logger.info(msg, **kwargs)

    def log_warning(self, msg: str, **kwargs):
        self._logger.warning(msg, **kwargs)

    def log_error(self, msg: str, **kwargs):
        self._logger.error(msg, **kwargs)
