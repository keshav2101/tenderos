"""Scheduler service triggering connector sync runs periodically."""
import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List
import asyncpg
import httpx
import structlog
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import UUID

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Scheduler Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

CONNECTOR_REGISTRY_URL = "http://connector-service:8003/connectors"
scheduler_running = False
_pool = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        pg_host = os.getenv("POSTGRES_HOST", "postgres")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_db = os.getenv("POSTGRES_DB", "tenderos")
        pg_user = os.getenv("POSTGRES_USER", "tenderos")
        pg_pwd = os.getenv("POSTGRES_PASSWORD", "tenderos_local_pwd")
        _pool = await asyncpg.create_pool(
            host=pg_host, port=int(pg_port),
            database=pg_db, user=pg_user, password=pg_pwd,
            min_size=1, max_size=5
        )
    return _pool

async def run_single_sync(source_id: str):
    """Run a single sync, insert into database, and update status on completion."""
    pool = await get_pool()
    job_id = None
    started_at = datetime.utcnow()
    
    # 1. Fetch connector UUID from db based on source_id
    connector_uuid = None
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM connectors WHERE source_id = $1", source_id)
        if row:
            connector_uuid = row["id"]
            
            # Create a running job entry
            job_id = await conn.fetchval(
                """
                INSERT INTO sync_jobs (connector_id, started_at, status)
                VALUES ($1, $2, 'running')
                RETURNING id
                """,
                connector_uuid, started_at
            )
            
    if not job_id:
        logger.warning("Could not create sync job log (connector not found in db)", source=source_id)
        return

    sync_url = f"{CONNECTOR_REGISTRY_URL}/{source_id}/sync"
    logger.info("Triggering connector sync job", source=source_id, url=sync_url, job_id=str(job_id))
    
    try:
        async with httpx.AsyncClient(timeout=65.0) as client:
            resp = await client.post(sync_url, timeout=60.0)
        finished_at = datetime.utcnow()
        duration = int((finished_at - started_at).total_seconds())
        
        if resp.status_code == 200:
            result = resp.json()
            t_found = result.get("records_fetched", 0)
            t_new = result.get("records_inserted", 0)
            t_up = result.get("records_updated", 0)
            t_fail = result.get("records_failed", 0)
            
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE sync_jobs SET
                        finished_at = $1, status = 'completed',
                        tenders_found = $2, tenders_new = $3,
                        tenders_updated = $4, tenders_failed = $5,
                        duration_seconds = $6
                    WHERE id = $7
                    """,
                    finished_at, t_found, t_new, t_up, t_fail, duration, job_id
                )
                
                # Also update last_sync_at on the connector
                await conn.execute(
                    "UPDATE connectors SET last_sync_at = $1 WHERE id = $2",
                    finished_at, connector_uuid
                )
            logger.info("Connector sync job completed successfully", source=source_id, job_id=str(job_id), duration=duration)
        else:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE sync_jobs SET
                        finished_at = $1, status = 'failed',
                        error_message = $2, duration_seconds = $3
                    WHERE id = $4
                    """,
                    finished_at, f"API returned status {resp.status_code}", duration, job_id
                )
            logger.error("Connector sync job failed with non-200 response", source=source_id, status=resp.status_code, job_id=str(job_id))
            
    except Exception as e:
        finished_at = datetime.utcnow()
        duration = int((finished_at - started_at).total_seconds())
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE sync_jobs SET
                    finished_at = $1, status = 'failed',
                    error_message = $2, duration_seconds = $3
                WHERE id = $4
                """,
                finished_at, str(e), duration, job_id
            )
        logger.error("Exception during connector sync job", source=source_id, error=str(e), job_id=str(job_id))

def cron_matches(cron_expr: str, dt: datetime) -> bool:
    """
    Check if datetime matches a standard 5-field cron expression.
    Supports *, numbers, comma (,), slash (/) for intervals.
    """
    parts = cron_expr.split()
    if len(parts) != 5:
        return True
        
    minute, hour, dom, month, dow = parts
    
    def match_field(field: str, val: int) -> bool:
        if field == '*':
            return True
        if '/' in field:
            base, step = field.split('/')
            step = int(step)
            if base == '*':
                return val % step == 0
            return (val - int(base)) % step == 0
        if ',' in field:
            return any(match_field(sub, val) for sub in field.split(','))
        if '-' in field:
            start, end = field.split('-')
            return int(start) <= val <= int(end)
        return int(field) == val

    cron_dow = dt.weekday() + 1
    if cron_dow == 7:
        cron_dow = 0
        
    try:
        return (
            match_field(minute, dt.minute) and
            match_field(hour, dt.hour) and
            match_field(dom, dt.day) and
            match_field(month, dt.month) and
            (match_field(dow, cron_dow) or (dow == '7' and cron_dow == 0))
        )
    except Exception:
        return True


async def trigger_connector_syncs():
    """Loop to check active connectors and trigger their sync processes based on cron schedules."""
    global scheduler_running
    scheduler_running = True
    logger.info("Scheduler worker loop started")

    while scheduler_running:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                pool = await get_pool()
                async with pool.acquire() as conn:
                    # Fetch active enabled connectors
                    connectors = await conn.fetch(
                        "SELECT id, source_id, refresh_cron, last_sync_at FROM connectors WHERE is_enabled = TRUE"
                    )
                    
                    current_time = datetime.utcnow()
                    logger.info("Scheduler checking cron matches", active_connectors=len(connectors), time=current_time.isoformat())
                    
                    for c in connectors:
                        source_id = c["source_id"]
                        refresh_cron = c["refresh_cron"]
                        last_sync_at = c["last_sync_at"]
                        
                        # Prevent duplicate running jobs
                        running_job = await conn.fetchval(
                            "SELECT id FROM sync_jobs WHERE connector_id = $1 AND status = 'running'",
                            c["id"]
                        )
                        if running_job:
                            logger.info("Sync job already running; skipping trigger", source=source_id)
                            continue
                            
                        # Trigger if never run before, or if cron matches current time
                        should_trigger = False
                        if not last_sync_at:
                            should_trigger = True
                        else:
                            should_trigger = cron_matches(refresh_cron, current_time)
                            
                        if should_trigger:
                            logger.info("Triggering scheduled sync run", source=source_id, cron=refresh_cron)
                            asyncio.create_task(run_single_sync(source_id))
        except Exception as e:
            logger.error("Error inside scheduler main loop", error=str(e))
        
        # Check every 60 seconds (1 minute resolution for cron)
        await asyncio.sleep(60)



@app.on_event("startup")
async def startup_event():
    await get_pool()
    asyncio.create_task(trigger_connector_syncs())


@app.on_event("shutdown")
async def shutdown_event():
    global scheduler_running
    scheduler_running = False
    if _pool:
        await _pool.close()
    logger.info("Scheduler loop stopped")


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "scheduler-service",
        "worker_active": scheduler_running
    }


@app.get("/scheduler/jobs")
async def list_jobs(limit: int = Query(20, ge=1, le=100)):
    """Retrieve list of recent sync jobs from DB."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT j.id, c.source_id, c.display_name, j.started_at, j.finished_at,
                       j.status, j.tenders_found, j.tenders_new, j.tenders_updated,
                       j.tenders_failed, j.error_message, j.duration_seconds
                FROM sync_jobs j
                JOIN connectors c ON j.connector_id = c.id
                ORDER BY j.started_at DESC
                LIMIT $1
                """,
                limit
            )
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error("Failed to list scheduler jobs", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/scheduler/jobs/{job_id}/logs")
async def get_job_logs(job_id: str):
    """Retrieve details and mock execution logs of a specific sync job."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT j.*, c.source_id, c.display_name
                FROM sync_jobs j
                JOIN connectors c ON j.connector_id = c.id
                WHERE j.id = $1
                """,
                UUID(job_id)
            )
            if not row:
                raise HTTPException(status_code=404, detail="Job not found")
                
            job_dict = dict(row)
            
            # Generate logs based on status
            logs = [
                f"[{job_dict['started_at'].isoformat()}] INFO: Scheduler initialized sync request for {job_dict['display_name']}.",
                f"[{job_dict['started_at'].isoformat()}] INFO: Live network connection negotiated with portal backend.",
            ]
            if job_dict["status"] == "running":
                logs.append(f"[{datetime.utcnow().isoformat()}] INFO: Crawling pages and downloading specifications in progress...")
            elif job_dict["status"] == "completed":
                logs.extend([
                    f"[{job_dict['finished_at'].isoformat()}] INFO: Completed crawl page extraction. Processed {job_dict['tenders_found']} notices.",
                    f"[{job_dict['finished_at'].isoformat()}] SUCCESS: Database sync complete. New: {job_dict['tenders_new']}, Updated: {job_dict['tenders_updated']}, Failed: {job_dict['tenders_failed']}.",
                ])
            else:
                logs.extend([
                    f"[{job_dict['finished_at'].isoformat()}] ERROR: Connection terminated or request aborted.",
                    f"[{job_dict['finished_at'].isoformat()}] FATAL: {job_dict['error_message'] or 'Unknown pipeline failure.'}"
                ])
            
            return {
                "job": job_dict,
                "logs": logs
            }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job UUID")
    except Exception as e:
        logger.error("Failed to fetch job details", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

