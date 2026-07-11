"""
eProcure National Portal Connector.
Fetches active tender notices from the central eProcure platform RSS feed.
Portal: https://eprocure.gov.in
"""
from __future__ import annotations
from datetime import datetime, timedelta
from typing import AsyncIterator, Optional
import httpx
import feedparser
from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)


class EProcureConnector(BaseConnector):
    """Central eProcure National Portal — RSS-based connector."""
    source_id = "eprocure"
    display_name = "eProcure National Portal"
    description = "Central government procurement via eprocure.gov.in"
    cadence = CadenceConfig(cron="*/30 * * * *", min_interval_seconds=1800,
                            description="Every 30 minutes")
    rate_limit = RateLimitConfig(requests_per_second=1.0, burst=3)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20

    RSS_URL = "https://eprocure.gov.in/cppp/latestactive/xml"
    PORTAL_URL = "https://eprocure.gov.in"
    access_limitations = "Same RSS feed as CPPP — provides central govt notices"

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        self.log_info("EProcureConnector: fetching RSS feed", url=self.RSS_URL)
        async with httpx.AsyncClient(timeout=self.timeout_seconds, follow_redirects=True) as client:
            try:
                resp = await client.get(self.RSS_URL, headers={"User-Agent": "TenderOS/1.0"})
                if resp.status_code == 200:
                    feed = feedparser.parse(resp.text)
                    count = 0
                    for entry in feed.entries:
                        raw = {
                            "title": entry.get("title", "eProcure Notice"),
                            "ministry": "Central Government",
                            "department": entry.get("author", "Various Departments"),
                            "organisation": "eProcure",
                            "state": "Delhi",
                            "estimated_cost_lakhs": 0.0,
                            "emd_lakhs": 0.0,
                            "tender_fee": 0.0,
                            "categories": ["General"],
                            "procurement_method": "open",
                            "published_at": entry.get("published", datetime.utcnow().isoformat()),
                            "submission_deadline": (datetime.utcnow() + timedelta(days=14)).isoformat(),
                        }
                        yield RawTender(
                            source_id=self.source_id,
                            source_tender_id=entry.get("id") or f"EP-{hash(entry.get('link',''))}",
                            source_url=entry.get("link", self.PORTAL_URL),
                            raw_json=raw,
                        )
                        count += 1
                    self.log_info("EProcureConnector: fetched entries", count=count)
                else:
                    self.log_warning("EProcureConnector: RSS returned non-200", status=resp.status_code)
            except Exception as e:
                self.log_error("EProcureConnector: fetch failed", error=str(e))

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.head(self.PORTAL_URL)
                return HealthStatus.HEALTHY if r.status_code < 500 else HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
