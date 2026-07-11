"""
Base Connector Interface — all data source connectors implement this.

Plugin architecture: drop a new connector file into connectors/plugins/
and register it in the connector registry. No core changes required.

Phase 14: Extended with ConnectorState, stats(), enable/disable, schedule() support.
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


class ConnectorStatus(str, Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    RUNNING = "running"
    IDLE = "idle"


@dataclass
class ConnectorState:
    """Runtime state and statistics for a connector."""
    source_id: str
    enabled: bool = True
    status: str = "idle"
    last_run: Optional[datetime] = None
    last_success: Optional[datetime] = None
    success_count: int = 0
    failure_count: int = 0
    total_tenders: int = 0
    new_tenders: int = 0
    updated_tenders: int = 0
    last_error: Optional[str] = None
    last_duration_seconds: float = 0.0
    quality_score: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "enabled": self.enabled,
            "status": self.status,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "last_success": self.last_success.isoformat() if self.last_success else None,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "total_tenders": self.total_tenders,
            "new_tenders": self.new_tenders,
            "updated_tenders": self.updated_tenders,
            "last_error": self.last_error,
            "last_duration_seconds": self.last_duration_seconds,
            "quality_score": self.quality_score,
        }


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

    Phase 14 extended interface:
      - health_check() -> HealthStatus
      - fetch_tenders() -> AsyncIterator[RawTender]
      - get_stats() -> ConnectorState
      - enable() / disable()
    """
    source_id: str
    display_name: str
    description: str
    cadence: CadenceConfig
    rate_limit: RateLimitConfig
    retry_policy: RetryPolicy
    timeout_seconds: int = 30

    # Access limitation documentation for gated portals
    access_limitations: str = ""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self._logger = structlog.get_logger().bind(connector=self.source_id)
        self._state = ConnectorState(source_id=self.source_id)

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

    def get_stats(self) -> ConnectorState:
        """Return current connector runtime statistics."""
        return self._state

    def enable(self):
        """Enable this connector for scheduled sync."""
        self._state.enabled = True
        self._logger.info("Connector enabled")

    def disable(self):
        """Disable this connector from scheduled sync."""
        self._state.enabled = False
        self._logger.info("Connector disabled")

    def record_run_start(self):
        """Mark that a run has started."""
        self._state.status = "running"
        self._state.last_run = datetime.utcnow()

    def record_run_success(self, new: int = 0, updated: int = 0, total: int = 0,
                           duration: float = 0.0, quality_score: float = 0.0):
        """Record a successful sync run."""
        self._state.status = "idle"
        self._state.last_success = datetime.utcnow()
        self._state.success_count += 1
        self._state.new_tenders = new
        self._state.updated_tenders = updated
        self._state.total_tenders = total
        self._state.last_duration_seconds = duration
        self._state.quality_score = quality_score
        self._state.last_error = None

    def record_run_failure(self, error: str):
        """Record a failed sync run."""
        self._state.status = "idle"
        self._state.failure_count += 1
        self._state.last_error = error

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
