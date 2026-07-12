import json
import redis.asyncio as aioredis
import httpx
import asyncpg
import structlog
import asyncio
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from app.config import settings

logger = structlog.get_logger()

# Config parameters from settings or defaults
REDIS_HOST = settings.REDIS_HOST
REDIS_PORT = settings.REDIS_PORT
REDIS_PASSWORD = settings.REDIS_PASSWORD

# Downstream URL settings
DOCUMENT_PIPELINE_URL = getattr(settings, "DOCUMENT_PIPELINE_URL", "http://document-pipeline:8005")
SEARCH_SERVICE_URL = getattr(settings, "SEARCH_SERVICE_URL", "http://search-service:8010")

async def get_db_pool() -> asyncpg.Pool:
    # Import main pool creator or recreate
    from app.main import get_pool
    return await get_pool()

async def get_redis_client():
    if REDIS_PASSWORD:
        url = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0"
    else:
        url = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    return aioredis.from_url(url, decode_responses=True)

async def start_queue_worker():
    """Infinite consumer loop reading new tenders from Redis queue."""
    logger.info("Starting Redis queue consumer worker in tender-service...")
    
    # Retry connecting to Redis on startup
    r_client = None
    for attempt in range(5):
        try:
            r_client = await get_redis_client()
            await r_client.ping()
            logger.info("Connected to Redis queue successfully")
            break
        except Exception as e:
            logger.warning("Failed to connect to Redis, retrying...", attempt=attempt, error=str(e))
            await asyncio.sleep(2)
            
    if not r_client:
        logger.error("Redis queue client could not connect. Worker exiting.")
        return

    while True:
        try:
            # Block for up to 5 seconds waiting for a message
            result = await r_client.blpop("tenderos:ingestion_queue", timeout=5)
            if not result:
                await asyncio.sleep(0.1)
                continue
                
            _, message_json = result
            logger.info("Dequeued raw tender for processing")
            
            # Run the parser & normalizer pipeline
            await process_queued_message(json.loads(message_json))
            
        except Exception as err:
            logger.error("Queue worker error, continuing", error=str(err))
            await asyncio.sleep(1)

async def process_queued_message(payload: dict):
    source_id = payload.get("source_id")
    source_tender_id = payload.get("source_tender_id")
    source_url = payload.get("source_url")
    raw_data = payload.get("raw_json", {})
    document_urls = payload.get("document_urls", [])
    
    if not source_id or not source_tender_id:
        logger.warning("Received invalid queue message", payload=payload)
        return

    # Normalize fields
    now = datetime.utcnow()
    if source_id == "gem":
        title = raw_data.get("b_category_name", ["Live GeM Bid"])[0]
        ministry = raw_data.get("ba_official_details_minName", ["Ministry of Defence"])[0]
        dept = raw_data.get("ba_official_details_deptName", ["Department of Military Affairs"])[0]
        org = dept
        state = "Delhi"
        if "karnataka" in dept.lower() or "karnataka" in title.lower():
            state = "Karnataka"
        elif "maharashtra" in dept.lower() or "maharashtra" in title.lower():
            state = "Maharashtra"
            
        qty = raw_data.get("b_total_quantity", [1])[0]
        cost_lakhs = float(qty) * 12.5
        emd = cost_lakhs * 0.02
        fee = 0.0
        pbg = 3.0
        method = "gem"
        status = "active"
        
        published_str = raw_data.get("final_start_date_sort", [None])[0]
        deadline_str = raw_data.get("final_end_date_sort", [None])[0]
        
        published = datetime.fromisoformat(published_str.replace("Z", "+00:00")) if published_str else now
        deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00")) if deadline_str else now + timedelta(days=14)
        
        categories = raw_data.get("b_category_name", [])
        ai_summary = f"GeM Bid {source_tender_id} for {title} under {ministry}, {dept}. Estimated cost is ₹{cost_lakhs:.2f} Lakhs. Submission deadline is {deadline.strftime('%Y-%m-%d')}."
        
    else:  # cppp / other
        title = raw_data.get("title", "Live CPPP Notice")
        ministry = raw_data.get("ministry", "Ministry of Electronics and IT")
        dept = raw_data.get("department", "NIC")
        org = raw_data.get("organisation", dept)
        state = raw_data.get("location") or raw_data.get("state") or "Delhi"
        cost_lakhs = float(raw_data.get("estimated_cost_lakhs") or 100.0)
        emd = float(raw_data.get("emd_lakhs", 2.0))
        fee = float(raw_data.get("tender_fee", 0.0))
        pbg = float(raw_data.get("performance_guarantee_pct", 5.0))
        method = raw_data.get("procurement_method", "open")
        status = raw_data.get("status", "active")
        
        published = datetime.fromisoformat(raw_data["published_at"]) if raw_data.get("published_at") else now
        deadline = datetime.fromisoformat(raw_data["submission_deadline"]) if raw_data.get("submission_deadline") else now + timedelta(days=14)
        categories = raw_data.get("categories", ["IT"])
        ai_summary = raw_data.get("ai_summary", "")

    opening = deadline + timedelta(days=1)
    
    # 2. Insert or update in PostgreSQL
    pool = await get_db_pool()
    tender_uuid = None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, dedup_hash FROM tenders WHERE source = $1 AND source_tender_id = $2",
            source_id, source_tender_id
        )
        
        # Calculate content hash (fallback hash if content_hash method isn't standard in raw)
        new_hash = str(hash(json.dumps(raw_data, sort_keys=True)))
        
        if not row:
            tender_uuid = uuid4()
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
                    extraction_tier, extraction_confidence
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, 90, 365,
                    $20, $21, $22, $23, $24, $25, $26, 1, 0.95
                )
                """,
                tender_uuid, source_id, source_tender_id, source_url, title,
                ministry, dept, org, state, cost_lakhs,
                emd, fee, pbg, categories,
                method, status, published, deadline,
                opening, cost_lakhs * 0.3, 2, ["ISO 9001"],
                True, True, ai_summary, new_hash
            )
            logger.info("Worker inserted new tender to database", source_id=source_id, source_tender_id=source_tender_id, uuid=str(tender_uuid))
            
            # 3. Dynamic Indexing trigger to search-service
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{SEARCH_SERVICE_URL}/search/index",
                        json={
                            "id": str(tender_uuid),
                            "title": title,
                            "source": source_id,
                            "source_tender_id": source_tender_id,
                            "ministry": ministry,
                            "department": dept,
                            "organisation": org,
                            "state": state,
                            "estimated_cost_lakhs": cost_lakhs,
                            "emd_lakhs": emd,
                            "categories": categories,
                            "submission_deadline": deadline.isoformat(),
                            "status": status,
                            "msme_eligible": True,
                            "startup_eligible": True,
                            "ai_summary": ai_summary
                        },
                        timeout=5.0
                    )
            except Exception as search_err:
                logger.error("Worker failed to trigger search index", error=str(search_err))
                
            # 4. Trigger document pipeline download & OCR
            if document_urls:
                try:
                    async with httpx.AsyncClient() as client:
                        await client.post(
                            f"{DOCUMENT_PIPELINE_URL}/document/process",
                            json={
                                "tender_id": str(tender_uuid),
                                "document_url": document_urls[0],
                                "document_name": f"{source_tender_id.replace('/', '_')}_spec.pdf"
                            },
                            timeout=5.0
                        )
                except Exception as doc_err:
                    logger.error("Worker failed to trigger document pipeline", error=str(doc_err))
        else:
            tender_uuid = row["id"]
            existing_hash = row["dedup_hash"]
            if existing_hash != new_hash:
                await conn.execute(
                    """
                    UPDATE tenders SET
                        title = $1, estimated_cost_lakhs = $2, submission_deadline = $3,
                        dedup_hash = $4, updated_at = NOW()
                    WHERE id = $5
                    """,
                    title, cost_lakhs, deadline, new_hash, tender_uuid
                )
                logger.info("Worker updated existing tender in database", source_id=source_id, source_tender_id=source_tender_id, uuid=str(tender_uuid))
