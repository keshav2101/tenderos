# Connector Development Guide

## Adding a New Connector

### 1. Choose the Right Base Class

| Base Class | Use When |
|---|---|
| `BaseConnector` | Custom source with unique fetch logic |
| `MinistryBaseConnector` | Central ministry filtered from CPPP |
| `PSUBaseConnector` | Public Sector Undertaking portal |
| `StateBaseConnector` | State/UT government portal |

### 2. Create the Connector File

Place the file in the appropriate subdirectory:
- **Central gov**: `app/connectors/plugins/central_gov/`
- **State/UT**: `app/connectors/plugins/state/`
- **Custom**: `app/connectors/plugins/`

### 3. Minimum Required Implementation

```python
from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)
from datetime import datetime
from typing import AsyncIterator, Optional

class MyNewConnector(BaseConnector):
    source_id = "my_portal"               # Must be globally unique
    display_name = "My Portal Name"
    description = "Short description"
    access_limitations = ""               # Document any WAF/login restrictions

    cadence = CadenceConfig(
        cron="0 */6 * * *",               # Every 6 hours
        min_interval_seconds=21600,
        description="Every 6 hours"
    )
    rate_limit = RateLimitConfig(requests_per_second=1.0, burst=3)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        # Your fetch logic here
        yield RawTender(
            source_id=self.source_id,
            source_tender_id="PORTAL/2026/0001",
            source_url="https://portal.gov.in/tender/0001",
            raw_json={
                "title": "Tender Title",
                "ministry": "Ministry Name",
                "department": "Department Name",
                "organisation": "Organisation",
                "state": "State Name",
                "estimated_cost_lakhs": 100.0,
                "emd_lakhs": 2.0,
                "tender_fee": 5000.0,
                "categories": ["Category"],
                "procurement_method": "open",
                "published_at": datetime.utcnow().isoformat(),
                "submission_deadline": ...,
                "contact_details": {"name": "Officer", "email": "officer@gov.in"},
            },
        )

    async def health_check(self) -> HealthStatus:
        # Check if portal is reachable
        import httpx
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.head("https://portal.gov.in")
                return HealthStatus.HEALTHY if r.status_code < 500 else HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
```

### 4. Auto-Discovery

The registry auto-discovers your connector at startup. No manual registration needed.

Verify registration:
```bash
curl http://localhost:8004/connectors | python -m json.tool | grep "my_portal"
```

### 5. Raw JSON Schema

The normalizer expects these fields in `raw_json`:

| Field | Type | Required |
|---|---|---|
| `title` | str | ✅ |
| `ministry` | str | ✅ |
| `department` | str | ✅ |
| `organisation` | str | ✅ |
| `state` | str | ✅ (one of 36 Indian states/UTs) |
| `estimated_cost_lakhs` | float | ✅ |
| `emd_lakhs` | float | ✅ |
| `tender_fee` | float | ✅ |
| `categories` | list[str] | ✅ |
| `procurement_method` | str | ✅ |
| `published_at` | ISO datetime str | ✅ |
| `submission_deadline` | ISO datetime str | ✅ |
| `contact_details` | dict (name, email, phone) | Recommended |
| `district` | str | Optional |
| `procurement_type` | str | Optional |
| `document_urls` | list[str] | Optional |

### 6. Quality Threshold

Tenders must score ≥30/100 on the quality engine to be accepted. Ensure your connectors populate at minimum: `title`, `ministry`, `state`, `estimated_cost_lakhs`, `emd_lakhs`, `published_at`, `submission_deadline`.

### 7. Testing

```bash
cd services/connector-service
python -m pytest tests/test_connector_framework.py -v --asyncio-mode=auto
```

Trigger a manual sync:
```bash
curl -X POST http://localhost:8004/connectors/my_portal/sync
```
