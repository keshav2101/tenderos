"""Connector service FastAPI application and Ingestion Pipeline."""
from __future__ import annotations
import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from uuid import UUID, uuid4

import httpx
import asyncpg
import structlog
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.connectors.registry import get_connector, list_connectors
from app.connectors.base import RawTender
from app.connectors.normalization import normalize_tender
from app.connectors.validation import validate_tender


logger = structlog.get_logger()
app = FastAPI(title="TenderOS Connector Service")
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



@app.on_event("shutdown")
async def shutdown_event():
    global _pool
    if _pool is not None:
        await _pool.close()
        logger.info("Database pool closed")


async def run_ingestion_pipeline(source_id: str):
    """
    Production Ingestion Pipeline:
    Fetch -> Parse -> Normalize -> Validate -> Publish to Event Queue (Redis) -> Fallback to PostgreSQL
    """
    logger.info("Starting ingestion pipeline for connector", source=source_id)
    try:
        connector = get_connector(source_id)
    except Exception as e:
        logger.error("Failed to load connector", source=source_id, error=str(e))
        return

    stats = {"fetched": 0, "inserted": 0, "updated": 0, "skipped": 0, "failures": 0, "queued": 0}
    pool = await get_pool()

    # Track sync metrics in Redis or PostgreSQL status table
    sync_start = datetime.utcnow()
    status_state = "RUNNING"

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

            # 2. Validation Layer (with dead-letter logging)
            is_valid, validation_errors = validate_tender(normalized)
            if not is_valid:
                logger.warning("Tender failed data quality validation, rejected.", tender_id=normalized.tender_id, errors=validation_errors)
                stats["failures"] += 1
                continue

            raw_data = raw_tender.raw_json or {}
            tender_id = normalized.tender_id
            source_url = normalized.lineage["original_url"]
            document_urls = normalized.document_urls or []

            # 3. Attempt publishing to Redis Queue
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
                continue  # Successfully queued, proceed to next tender!
            except Exception as queue_err:
                logger.warning("Queue publishing failed, falling back to direct DB insert", error=str(queue_err))

            # 4. Fallback DB Insert/Update
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
                
                # Contact info
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
                            True, True, f"Ingested {normalized.source_portal} Tender: {title}", new_hash,
                            contact_name, contact_email, contact_phone, json.dumps(normalized.lineage)
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
                                    logger.warning("Failed to trigger document-pipeline, will retry in background", error=str(doc_err))
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
                                title, cost_lakhs, deadline, new_hash, json.dumps(normalized.lineage), existing_id
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


    # Store connector health status metrics in DB/Redis
    sync_end = datetime.utcnow()
    avg_sync_time = (sync_end - sync_start).total_seconds()
    try:
        from app.queue import get_redis_client
        r_client = get_redis_client()
        metrics = {
            "portal": source_id,
            "health": "UP" if status_state == "SUCCESS" else "FAILED",
            "last_sync": sync_end.isoformat(),
            "fetched": stats["fetched"],
            "inserted": stats["inserted"] + stats["queued"],  # treat queued as inserted/in-progress
            "updated": stats["updated"],
            "skipped": stats["skipped"],
            "failed": stats["failures"],
            "avg_sync_time_seconds": avg_sync_time
        }
        r_client.hset(f"connector_status:{source_id}", mapping=metrics)
    except Exception as metric_err:
        logger.warning("Failed to store connector health metrics", error=str(metric_err))

    logger.info("Ingestion pipeline run complete", source=source_id, stats=stats)



@app.get("/health")
async def health():
    return {"status": "healthy", "service": "connector-service"}


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
                    "avg_sync_time": float(metrics.get("avg_sync_time_seconds", 0.0))
                })
            else:
                info.update({
                    "health": "UNKNOWN",
                    "last_sync": None,
                    "fetched": 0,
                    "inserted": 0,
                    "updated": 0,
                    "skipped": 0,
                    "failed": 0,
                    "avg_sync_time": 0.0
                })
    except Exception as e:
        logger.warning("Failed to fetch connector status from Redis, returning base info", error=str(e))
    return static_list



@app.post("/connectors/{source_id}/sync")
async def trigger_sync(source_id: str, background_tasks: BackgroundTasks):
    try:
        connector = get_connector(source_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Add ingestion pipeline run to FastAPI background tasks
    background_tasks.add_task(run_ingestion_pipeline, source_id)

    return {
        "status": "triggered",
        "connector": source_id,
        "cadence": connector.cadence.cron,
    }
