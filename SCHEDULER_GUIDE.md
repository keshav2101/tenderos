# Scheduler Guide — TenderOS Phase 14

## Overview

TenderOS uses **APScheduler** (AsyncIOScheduler) to run connector sync jobs on configurable cron schedules. The scheduler starts automatically with the connector service on application startup.

---

## Cadence Configuration

Each connector defines its crawl cadence via `CadenceConfig`:

```python
cadence = CadenceConfig(
    cron="0 */6 * * *",        # Standard cron expression
    min_interval_seconds=21600, # Minimum gap between syncs (seconds)
    description="Every 6 hours"
)
```

Default cadences by tier:

| Portal Type | Default Cron | Interval |
|---|---|---|
| GeM (live API) | `*/15 * * * *` | 15 minutes |
| CPPP/eProcure (RSS) | `*/30 * * * *` | 30 minutes |
| Railways | `0 * * * *` | 1 hour |
| Ministries | `0 */2 * * *` | 2 hours |
| PSUs | `0 */4 * * *` | 4 hours |
| States/UTs | `0 */6 * * *` | 6 hours |

---

## Exponential Backoff

On failure, the scheduler applies exponential backoff before the next attempt:

```
backoff = min(2.0 ^ consecutive_failures, 300 seconds)
```

After a successful run, the failure counter resets to 0.

---

## Redis Checkpoints

After each successful sync, the scheduler persists:
```
Redis key: connector:last_crawl:{source_id}
Value: ISO timestamp of last successful run
TTL: 7 days
```

This enables incremental crawling — connectors receive the `since` timestamp to only fetch new/updated tenders.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/connectors/scheduler/status` | View running jobs + next run times |
| `POST` | `/connectors/{id}/sync` | Manually trigger a connector |
| `POST` | `/connectors/run-all` | Trigger all enabled connectors |
| `POST` | `/connectors/{id}/disable` | Pause scheduled job |
| `POST` | `/connectors/{id}/enable` | Resume scheduled job |

---

## Monitoring

Scheduler status response:
```json
{
  "running": true,
  "total_jobs": 59,
  "jobs": [
    {
      "id": "sync_gem",
      "name": "Sync Government e-Marketplace",
      "next_run": "2026-07-11T18:15:00+00:00",
      "trigger": "cron[*/15 * * * *]"
    }
  ]
}
```
