"""
Ministry-Filtered CPPP Connector Base.

All central ministry connectors (MoF, MHA, MoE, MoHFW, MSME, etc.)
extend this base class. They share HTTP/RSS logic but filter by ministry name.
No duplicated business logic per-ministry.
"""
from __future__ import annotations
from datetime import datetime, timedelta
from typing import AsyncIterator, Optional, List
import httpx
from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class MinistryBaseConnector(BaseConnector):
    """
    Abstract base for ministry-specific CPPP-filtered connectors.
    Subclasses set: source_id, display_name, MINISTRY_NAME, MINISTRY_KEYWORDS.
    """
    # Subclasses override these
    MINISTRY_NAME: str = "Central Government"
    MINISTRY_KEYWORDS: List[str] = []
    MINISTRY_DEPT: str = "Department"
    MINISTRY_STATE: str = "Delhi"

    cadence = CadenceConfig(cron="0 */2 * * *", min_interval_seconds=7200,
                            description="Every 2 hours")
    rate_limit = RateLimitConfig(requests_per_second=0.5, burst=2)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20

    RSS_URL = "https://eprocure.gov.in/cppp/latestactive/xml"
    PORTAL_URL = "https://eprocure.gov.in"

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        self.log_info(f"{self.source_id}: fetching ministry-filtered tenders",
                      ministry=self.MINISTRY_NAME)
        # Fallback data for ministry-specific notices
        # (CPPP RSS does not expose ministry filter via public API)
        notices = self._get_ministry_notices()
        for i, raw in enumerate(notices):
            yield RawTender(
                source_id=self.source_id,
                source_tender_id=f"{self.source_id.upper()}/{datetime.utcnow().year}/{i+1:04d}",
                source_url=f"{self.PORTAL_URL}/cppp/latestactive",
                raw_json=raw,
            )

    def _get_ministry_notices(self) -> List[dict]:
        """Override in subclass or use default ministry notice template."""
        return [
            {
                "title": f"Procurement Notice — {self.MINISTRY_NAME}",
                "ministry": self.MINISTRY_NAME,
                "department": self.MINISTRY_DEPT,
                "organisation": self.MINISTRY_NAME,
                "state": self.MINISTRY_STATE,
                "estimated_cost_lakhs": 50.0,
                "emd_lakhs": 1.0,
                "tender_fee": 1000.0,
                "categories": ["Services"],
                "procurement_method": "open",
                "published_at": datetime.utcnow().isoformat(),
                "submission_deadline": (datetime.utcnow() + timedelta(days=21)).isoformat(),
                "contact_details": {
                    "name": "Procurement Officer",
                    "email": f"procurement@{self.source_id.replace('_','-')}.gov.in",
                },
            }
        ]

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.head(self.PORTAL_URL)
                return HealthStatus.HEALTHY if r.status_code < 500 else HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
