"""
TenderOS Connector Scheduler — Phase 14.

APScheduler-based cron engine that:
  - Reads cadence from each connector's CadenceConfig.cron
  - Runs all enabled connectors on their configured schedules
  - Applies exponential backoff on failure
  - Persists checkpoints to Redis
  - Skips disabled connectors
"""
from __future__ import annotations
import asyncio
from datetime import datetime
from typing import Dict, Optional
import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = structlog.get_logger()

_scheduler: Optional[AsyncIOScheduler] = None

# Backoff state: source_id -> consecutive failure count
_failure_counts: Dict[str, int] = {}
_MAX_BACKOFF_SECONDS = 300.0
_BACKOFF_BASE = 2.0


async def _run_connector_safe(source_id: str):
    """Wrapper that runs the ingestion pipeline with error tracking."""
    from app.main import run_ingestion_pipeline
    from app.connectors.registry import get_connector
    from app.connectors.incremental import set_last_crawl

    try:
        connector = get_connector(source_id)
        if not connector._state.enabled:
            logger.info("Connector disabled — skipping scheduled run", source=source_id)
            return

        # Check backoff
        failures = _failure_counts.get(source_id, 0)
        if failures > 0:
            backoff = min(_BACKOFF_BASE ** failures, _MAX_BACKOFF_SECONDS)
            logger.info("Applying backoff before retry", source=source_id,
                        failures=failures, backoff_seconds=backoff)
            await asyncio.sleep(backoff)

        logger.info("Scheduler: triggering sync", source=source_id,
                    scheduled_at=datetime.utcnow().isoformat())
        await run_ingestion_pipeline(source_id)

        # Success — reset failure count and store checkpoint
        _failure_counts[source_id] = 0
        set_last_crawl(source_id)

    except Exception as e:
        _failure_counts[source_id] = _failure_counts.get(source_id, 0) + 1
        logger.error("Scheduled connector run failed",
                     source=source_id, error=str(e),
                     consecutive_failures=_failure_counts[source_id])


def start_scheduler():
    """Initialize and start the APScheduler with all registered connector cron jobs."""
    global _scheduler
    if _scheduler and _scheduler.running:
        logger.warning("Scheduler already running")
        return

    from app.connectors.registry import list_connectors, get_connector

    _scheduler = AsyncIOScheduler(timezone="UTC")
    connectors = list_connectors()

    for source_id, info in connectors.items():
        cron_expr = info.get("cadence", "0 */6 * * *")
        try:
            _scheduler.add_job(
                _run_connector_safe,
                trigger=CronTrigger.from_crontab(cron_expr, timezone="UTC"),
                args=[source_id],
                id=f"sync_{source_id}",
                name=f"Sync {info.get('display_name', source_id)}",
                replace_existing=True,
                misfire_grace_time=300,
                max_instances=1,
            )
            logger.info("Scheduled connector", source=source_id, cron=cron_expr)
        except Exception as e:
            logger.error("Failed to schedule connector", source=source_id,
                         cron=cron_expr, error=str(e))

    _scheduler.start()
    logger.info("TenderOS Connector Scheduler started",
                total_jobs=len(_scheduler.get_jobs()))


def stop_scheduler():
    """Stop the APScheduler gracefully."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Connector Scheduler stopped")


def get_scheduler_status() -> dict:
    """Return current scheduler status and job info."""
    if not _scheduler:
        return {"running": False, "jobs": []}

    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        })

    return {
        "running": _scheduler.running,
        "total_jobs": len(jobs),
        "jobs": jobs,
    }


def disable_connector_schedule(source_id: str):
    """Pause a specific connector's schedule."""
    global _scheduler
    if _scheduler:
        try:
            _scheduler.pause_job(f"sync_{source_id}")
            logger.info("Paused connector schedule", source=source_id)
        except Exception as e:
            logger.warning("Could not pause connector schedule", source=source_id, error=str(e))


def enable_connector_schedule(source_id: str):
    """Resume a specific connector's schedule."""
    global _scheduler
    if _scheduler:
        try:
            _scheduler.resume_job(f"sync_{source_id}")
            logger.info("Resumed connector schedule", source=source_id)
        except Exception as e:
            logger.warning("Could not resume connector schedule", source=source_id, error=str(e))
