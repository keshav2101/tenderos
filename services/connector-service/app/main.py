"""Connector service FastAPI application and Ingestion Pipeline — Phase 14."""
from __future__ import annotations
import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from uuid import UUID, uuid4

import httpx
import asyncpg
import structlog
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.connectors.registry import get_connector, list_connectors, get_all_source_ids
from app.connectors.base import RawTender
from app.connectors.normalization import normalize_tender
from app.connectors.validation import validate_tender


logger = structlog.get_logger()
app = FastAPI(title="TenderOS Connector Service", version="14.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST, port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB, user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD, min_size=2, max_size=10,
        )
    return _pool


@app.on_event("startup")
async def startup_event():
    pool = await get_pool()
    try:
        async with pool.acquire() as conn:
            await conn.execute("ALTER TABLE tenders ADD COLUMN IF NOT EXISTS lineage JSONB;")
        logger.info("Connector service started and database pool initialized with lineage column")
    except Exception as e:
        logger.error("Failed to run startup migrations", error=str(e))

    # Start scheduler
    try:
        from app.scheduler import start_scheduler
        start_scheduler()
        logger.info("APScheduler connector scheduler started")
    except Exception as e:
        logger.error("Failed to start scheduler", error=str(e))


@app.on_event("shutdown")
async def shutdown_event():
    global _pool
    if _pool is not None:
        await _pool.close()
        logger.info("Database pool closed")
    try:
        from app.scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


async def run_ingestion_pipeline(source_id: str):
    """
    Production Ingestion Pipeline:
    Fetch -> Parse -> Normalize -> Validate -> Quality Score -> Publish to Queue -> Fallback to PostgreSQL
    """
    logger.info("Starting ingestion pipeline for connector", source=source_id)
    try:
        connector = get_connector(source_id)
    except Exception as e:
        logger.error("Failed to load connector", source=source_id, error=str(e))
        return

    from app.connectors.quality_engine import (
        compute_quality_score, ConnectorQualityReport, is_quality_acceptable
    )

    stats = {"fetched": 0, "inserted": 0, "updated": 0, "skipped": 0, "failures": 0, "queued": 0}
    pool = await get_pool()
    sync_start = datetime.utcnow()
    status_state = "RUNNING"
    quality_report = ConnectorQualityReport(source_id)

    connector.record_run_start()

    try:
        async for raw_tender in connector.fetch_tenders():
            stats["fetched"] += 1

            # 1. Normalization Layer
            try:
                normalized = normalize_tender(raw_tender)
            except Exception as norm_err:
                logger.error("Failed to normalize raw tender", source_id=source_id, error=str(norm_err))
                stats["failures"] += 1
                continue

            # 2. Quality Scoring
            tender_dict = normalized.model_dump(mode="json")
            quality_score = compute_quality_score(tender_dict)
            acceptable = is_quality_acceptable(quality_score)
            quality_report.record(quality_score, acceptable)
            if not acceptable:
                logger.warning("Tender below quality threshold — rejected",
                               tender_id=normalized.tender_id, score=quality_score)
                stats["failures"] += 1
                continue

            # 3. Validation Layer (dead-letter logging)
            is_valid, validation_errors = validate_tender(normalized)
            if not is_valid:
                logger.warning("Tender failed data quality validation, rejected.",
                               tender_id=normalized.tender_id, errors=validation_errors)
                stats["failures"] += 1
                continue

            raw_data = raw_tender.raw_json or {}
            tender_id = normalized.tender_id
            source_url = normalized.lineage["original_url"]
            document_urls = normalized.document_urls or []

            # 4. Attempt publishing to Redis Queue
            try:
                from app.queue import publish_tender_event
                publish_tender_event(
                    source_id=source_id,
                    raw_tender_data=normalized.model_dump(mode="json"),
                    source_url=source_url,
                    source_tender_id=tender_id,
                    document_urls=document_urls
                )
                stats["queued"] += 1
                continue
            except Exception as queue_err:
                logger.warning("Queue publishing failed, falling back to direct DB insert",
                               error=str(queue_err))

            # 5. Fallback DB Insert/Update
            try:
                title = normalized.title
                ministry = normalized.ministry
                dept = normalized.department
                org = normalized.organisation
                state = normalized.location
                cost_lakhs = normalized.estimated_cost_lakhs
                emd = normalized.emd_lakhs
                fee = normalized.tender_fee
                categories = normalized.categories
                method = normalized.procurement_method
                status = "active"
                published = normalized.published_at
                deadline = normalized.submission_deadline
                opening = normalized.opening_date or (deadline + timedelta(days=1))
                contact_name = normalized.contact_details.get("name")
                contact_email = normalized.contact_details.get("email")
                contact_phone = normalized.contact_details.get("phone")

                async with pool.acquire() as conn:
                    row = await conn.fetchrow(
                        "SELECT id, dedup_hash FROM tenders WHERE source = $1 AND source_tender_id = $2",
                        source_id, tender_id
                    )
                    new_hash = raw_tender.content_hash()

                    if not row:
                        new_id = uuid4()
                        await conn.execute(
                            """
                            INSERT INTO tenders (
                                id, source, source_tender_id, source_url, title,
                                ministry, department, organisation, state, estimated_cost_lakhs,
                                emd_lakhs, tender_fee, performance_guarantee_pct, categories,
                                procurement_method, status, published_at, submission_deadline,
                                opening_date, bid_validity_days, work_completion_days,
                                turnover_min_lakhs, experience_years, certifications_required,
                                msme_eligible, startup_eligible, ai_summary, dedup_hash,
                                extraction_tier, extraction_confidence, contact_name, contact_email,
                                contact_phone, lineage
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                                $11, $12, $13, $14, $15, $16, $17, $18, $19, 90, 365,
                                $20, $21, $22, $23, $24, $25, $26, 1, 0.95, $27, $28, $29, $30
                            )
                            """,
                            new_id, source_id, tender_id, source_url, title,
                            ministry, dept, org, state, cost_lakhs,
                            emd, fee, 5.0, categories,
                            method, status, published, deadline,
                            opening, cost_lakhs * 0.3 if cost_lakhs else 10.0, 3, ["ISO 9001"],
                            True, True,
                            f"Ingested {normalized.source_portal} Tender: {title}", new_hash,
                            contact_name, contact_email, contact_phone,
                            json.dumps(normalized.lineage)
                        )
                        stats["inserted"] += 1

                        if document_urls:
                            async with httpx.AsyncClient() as client:
                                try:
                                    await client.post(
                                        f"{settings.DOCUMENT_PIPELINE_URL}/document/process",
                                        json={
                                            "tender_id": str(new_id),
                                            "document_url": document_urls[0],
                                            "document_name": f"{tender_id.replace('/', '_')}_spec.pdf"
                                        },
                                        timeout=5.0
                                    )
                                except Exception as doc_err:
                                    logger.warning("Failed to trigger document-pipeline",
                                                   error=str(doc_err))
                    else:
                        existing_id = row["id"]
                        existing_hash = row["dedup_hash"]
                        if existing_hash != new_hash:
                            await conn.execute(
                                """
                                UPDATE tenders SET
                                    title = $1, estimated_cost_lakhs = $2, submission_deadline = $3,
                                    dedup_hash = $4, updated_at = NOW(), lineage = $5
                                WHERE id = $6
                                """,
                                title, cost_lakhs, deadline, new_hash,
                                json.dumps(normalized.lineage), existing_id
                            )
                            stats["updated"] += 1
                        else:
                            stats["skipped"] += 1

            except Exception as db_err:
                logger.error("Database write failure", source_id=source_id, error=str(db_err))
                stats["failures"] += 1

        status_state = "SUCCESS"

    except Exception as e:
        logger.error("Crawler sync job crashed", source_id=source_id, error=str(e))
        stats["failures"] += 1
        status_state = "FAILED"

    sync_end = datetime.utcnow()
    avg_sync_time = (sync_end - sync_start).total_seconds()

    # Record run outcome on connector state
    if status_state == "SUCCESS":
        connector.record_run_success(
            new=stats["inserted"],
            updated=stats["updated"],
            total=stats["fetched"],
            duration=avg_sync_time,
            quality_score=quality_report.avg_score,
        )
    else:
        connector.record_run_failure(error="Pipeline crashed")

    # Store connector health status metrics in Redis
    try:
        from app.queue import get_redis_client
        r_client = get_redis_client()
        metrics = {
            "portal": source_id,
            "health": "UP" if status_state == "SUCCESS" else "FAILED",
            "last_sync": sync_end.isoformat(),
            "fetched": stats["fetched"],
            "inserted": stats["inserted"] + stats["queued"],
            "updated": stats["updated"],
            "skipped": stats["skipped"],
            "failed": stats["failures"],
            "avg_sync_time_seconds": avg_sync_time,
            "quality_score": quality_report.avg_score,
            "quality_pass_rate": quality_report.pass_rate,
        }
        r_client.hset(f"connector_status:{source_id}", mapping=metrics)
    except Exception as metric_err:
        logger.warning("Failed to store connector health metrics", error=str(metric_err))

    logger.info("Ingestion pipeline run complete", source=source_id, stats=stats,
                quality=quality_report.to_dict())


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "connector-service", "version": "14.0.0"}


# ─── Connector Listing ────────────────────────────────────────────────────────

@app.get("/connectors")
async def get_connectors():
    static_list = list_connectors()
    try:
        from app.queue import get_redis_client
        r_client = get_redis_client()
        for source_id, info in static_list.items():
            metrics = r_client.hgetall(f"connector_status:{source_id}")
            if metrics:
                info.update({
                    "health": metrics.get("health", "UP"),
                    "last_sync": metrics.get("last_sync", ""),
                    "fetched": int(metrics.get("fetched", 0)),
                    "inserted": int(metrics.get("inserted", 0)),
                    "updated": int(metrics.get("updated", 0)),
                    "skipped": int(metrics.get("skipped", 0)),
                    "failed": int(metrics.get("failed", 0)),
                    "avg_sync_time": float(metrics.get("avg_sync_time_seconds", 0.0)),
                    "quality_score": float(metrics.get("quality_score", 0.0)),
                })
            else:
                info.update({
                    "health": "UNKNOWN", "last_sync": None,
                    "fetched": 0, "inserted": 0, "updated": 0,
                    "skipped": 0, "failed": 0, "avg_sync_time": 0.0,
                    "quality_score": 0.0,
                })
    except Exception as e:
        logger.warning("Failed to fetch connector status from Redis", error=str(e))
    return static_list


# ─── NEW: Connector Status (per-connector health) ─────────────────────────────

@app.get("/connectors/status")
async def get_connectors_status():
    """Return per-connector health and last run statistics."""
    all_ids = get_all_source_ids()
    result = {}
    try:
        from app.queue import get_redis_client
        r_client = get_redis_client()
        for source_id in all_ids:
            metrics = r_client.hgetall(f"connector_status:{source_id}")
            if metrics:
                result[source_id] = {k.decode() if isinstance(k, bytes) else k:
                                      v.decode() if isinstance(v, bytes) else v
                                      for k, v in metrics.items()}
                result[source_id]["source_id"] = source_id
            else:
                result[source_id] = {
                    "source_id": source_id, "health": "UNKNOWN",
                    "last_sync": None, "fetched": 0, "inserted": 0,
                    "quality_score": 0.0,
                }
    except Exception as e:
        logger.warning("Failed to fetch connector status", error=str(e))
        for sid in all_ids:
            result[sid] = {"source_id": sid, "health": "UNKNOWN"}
    return result


# ─── NEW: Aggregated Stats ────────────────────────────────────────────────────

@app.get("/connectors/stats")
async def get_connectors_stats():
    """Return aggregated metrics across all connectors."""
    all_ids = get_all_source_ids()
    total_connectors = len(all_ids)
    total_fetched = total_inserted = total_updated = total_failed = 0
    healthy = degraded = failed = unknown = 0

    try:
        from app.queue import get_redis_client
        r_client = get_redis_client()
        for source_id in all_ids:
            metrics = r_client.hgetall(f"connector_status:{source_id}")
            if metrics:
                health = metrics.get(b"health", b"UNKNOWN").decode()
                if health == "UP":
                    healthy += 1
                elif health == "FAILED":
                    failed += 1
                else:
                    unknown += 1
                total_fetched += int(metrics.get(b"fetched", 0))
                total_inserted += int(metrics.get(b"inserted", 0))
                total_updated += int(metrics.get(b"updated", 0))
                total_failed += int(metrics.get(b"failed", 0))
            else:
                unknown += 1
    except Exception as e:
        logger.warning("Failed to aggregate connector stats", error=str(e))

    return {
        "total_connectors": total_connectors,
        "healthy": healthy,
        "degraded": degraded,
        "failed": failed,
        "unknown": unknown,
        "total_fetched": total_fetched,
        "total_inserted": total_inserted,
        "total_updated": total_updated,
        "total_failed": total_failed,
    }


# ─── NEW: Single Connector Details ────────────────────────────────────────────

@app.get("/connectors/{source_id}/details")
async def get_connector_details(source_id: str):
    """Return detailed metadata for a single connector."""
    try:
        connector = get_connector(source_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    state = connector.get_stats().to_dict()
    info = list_connectors().get(source_id, {})

    try:
        from app.queue import get_redis_client
        r_client = get_redis_client()
        redis_metrics = r_client.hgetall(f"connector_status:{source_id}")
        if redis_metrics:
            for k, v in redis_metrics.items():
                k = k.decode() if isinstance(k, bytes) else k
                state[k] = v.decode() if isinstance(v, bytes) else v
    except Exception:
        pass

    return {**info, **state}


# ─── NEW: Run All Connectors ──────────────────────────────────────────────────

@app.post("/connectors/run-all")
async def trigger_all_sync(background_tasks: BackgroundTasks):
    """Trigger sync for all enabled connectors."""
    all_ids = get_all_source_ids()
    triggered = []
    for source_id in all_ids:
        try:
            connector = get_connector(source_id)
            if connector._state.enabled:
                background_tasks.add_task(run_ingestion_pipeline, source_id)
                triggered.append(source_id)
        except Exception:
            pass
    return {"status": "triggered", "connectors": triggered, "total": len(triggered)}


# ─── NEW: Disable Connector ───────────────────────────────────────────────────

@app.post("/connectors/{source_id}/disable")
async def disable_connector(source_id: str):
    """Disable a connector from scheduled sync."""
    try:
        connector = get_connector(source_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    connector.disable()
    try:
        from app.scheduler import disable_connector_schedule
        disable_connector_schedule(source_id)
    except Exception:
        pass
    return {"status": "disabled", "connector": source_id}


# ─── NEW: Enable Connector ────────────────────────────────────────────────────

@app.post("/connectors/{source_id}/enable")
async def enable_connector(source_id: str):
    """Re-enable a connector for scheduled sync."""
    try:
        connector = get_connector(source_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    connector.enable()
    try:
        from app.scheduler import enable_connector_schedule
        enable_connector_schedule(source_id)
    except Exception:
        pass
    return {"status": "enabled", "connector": source_id}


# ─── NEW: Scheduler Status ────────────────────────────────────────────────────

@app.get("/connectors/scheduler/status")
async def get_scheduler_status():
    """Return APScheduler status and all job schedules."""
    try:
        from app.scheduler import get_scheduler_status as _status
        return _status()
    except Exception as e:
        return {"running": False, "error": str(e)}


# ─── Existing: Sync Specific Connector ───────────────────────────────────────

@app.post("/connectors/{source_id}/sync")
async def trigger_sync(source_id: str, background_tasks: BackgroundTasks):
    try:
        connector = get_connector(source_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    background_tasks.add_task(run_ingestion_pipeline, source_id)

    return {
        "status": "triggered",
        "connector": source_id,
        "cadence": connector.cadence.cron,
    }
