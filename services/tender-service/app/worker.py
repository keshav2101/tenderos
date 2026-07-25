import asyncio
import json
from datetime import datetime, timedelta
from uuid import uuid4

import asyncpg
import httpx
import redis.asyncio as aioredis
import structlog
from app.config import settings

logger = structlog.get_logger()

# Config parameters from settings or defaults
REDIS_HOST = settings.REDIS_HOST
REDIS_PORT = settings.REDIS_PORT
REDIS_PASSWORD = settings.REDIS_PASSWORD

# Downstream URL settings
DOCUMENT_PIPELINE_URL = getattr(
    settings, "DOCUMENT_PIPELINE_URL", "http://document-pipeline:8005"
)
SEARCH_SERVICE_URL = getattr(
    settings, "SEARCH_SERVICE_URL", "http://search-service:8010"
)

STATE_COORDS = {
    "Andhra Pradesh": (15.9129, 79.7400),
    "Arunachal Pradesh": (28.2180, 94.7278),
    "Assam": (26.2006, 92.9376),
    "Bihar": (25.0961, 85.3131),
    "Chhattisgarh": (21.2787, 81.8661),
    "Goa": (15.2993, 74.1240),
    "Gujarat": (22.2587, 71.1924),
    "Haryana": (29.0588, 76.0856),
    "Himachal Pradesh": (31.1048, 77.1734),
    "Jharkhand": (23.6102, 85.2799),
    "Karnataka": (15.3173, 75.7139),
    "Kerala": (10.8505, 76.2711),
    "Madhya Pradesh": (22.9734, 78.6569),
    "Maharashtra": (19.7515, 75.7139),
    "Manipur": (24.6637, 93.9063),
    "Meghalaya": (25.4670, 91.3662),
    "Mizoram": (23.1645, 92.9376),
    "Nagaland": (26.1584, 94.5624),
    "Odisha": (20.9517, 85.0985),
    "Punjab": (31.1471, 75.3412),
    "Rajasthan": (27.0238, 74.2179),
    "Sikkim": (27.5330, 88.5122),
    "Tamil Nadu": (11.1271, 78.6569),
    "Telangana": (18.1124, 79.0193),
    "Tripura": (23.9408, 91.9882),
    "Uttar Pradesh": (26.8467, 80.9462),
    "Uttarakhand": (30.0668, 79.0193),
    "West Bengal": (22.9868, 87.8550),
    "Delhi": (28.6139, 77.2090),
}


async def get_db_pool() -> asyncpg.Pool:
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

    r_client = None
    for attempt in range(5):
        try:
            r_client = await get_redis_client()
            await r_client.ping()
            logger.info("Connected to Redis queue successfully")
            break
        except Exception as e:
            logger.warning(
                "Failed to connect to Redis, retrying...", attempt=attempt, error=str(e)
            )
            await asyncio.sleep(2)

    if not r_client:
        logger.error("Redis queue client could not connect. Worker exiting.")
        return

    while True:
        try:
            result = await r_client.blpop("tenderos:ingestion_queue", timeout=5)
            if not result:
                await asyncio.sleep(0.1)
                continue

            _, message_json = result
            logger.info("Dequeued raw tender for processing")

            await process_queued_message(json.loads(message_json))

        except Exception as err:
            logger.error("Queue worker error, continuing", error=str(err))
            await asyncio.sleep(1)


def derive_codes(title: str) -> tuple[str | None, str | None]:
    title_lower = title.lower()
    if any(
        k in title_lower
        for k in ["software", "erp", "app ", "application", "portal", "cloud", "saas"]
    ):
        return "72200000", "43230000"
    if any(
        k in title_lower
        for k in ["computer", "hardware", "server", "laptop", "printer"]
    ):
        return "30200000", "43210000"
    if any(
        k in title_lower for k in ["construction", "building", "civil", "structure"]
    ):
        return "45200000", "72000000"
    if any(k in title_lower for k in ["road", "highway", "bridge", "flyover"]):
        return "45233140", "72141103"
    if any(
        k in title_lower
        for k in ["medical", "health", "hospital", "medicine", "ventilator", "x-ray"]
    ):
        return "33000000", "42000000"
    if any(k in title_lower for k in ["consult", "study", "dpr", "advisory"]):
        return "79311100", "80100000"
    return None, None


async def process_queued_message(payload: dict):
    source_id = payload.get("source_id")
    source_tender_id = payload.get("source_tender_id")
    source_url = payload.get("source_url")
    raw_data = payload.get("raw_json", {})
    document_urls = payload.get("document_urls", [])

    if not source_id or not source_tender_id:
        logger.warning("Received invalid queue message", payload=payload)
        return

    now = datetime.utcnow()

    # Extract & map basic fields
    if source_id == "gem":
        title = raw_data.get("b_category_name", ["Live GeM Bid"])[0]
        ministry = raw_data.get("ba_official_details_minName", ["Ministry of Defence"])[
            0
        ]
        dept = raw_data.get(
            "ba_official_details_deptName", ["Department of Military Affairs"]
        )[0]
        org = dept
        state = "Delhi"
        if "karnataka" in dept.lower() or "karnataka" in title.lower():
            state = "Karnataka"
        elif "maharashtra" in dept.lower() or "maharashtra" in title.lower():
            state = "Maharashtra"

        qty = raw_data.get("b_total_quantity", [1])[0]
        try:
            cost_lakhs = float(qty) * 12.5
        except (ValueError, TypeError):
            cost_lakhs = 12.5
        emd = cost_lakhs * 0.02
        fee = 0.0
        pbg = 3.0
        method = "gem"
        status = "active"

        published_str = raw_data.get("final_start_date_sort", [None])[0]
        deadline_str = raw_data.get("final_end_date_sort", [None])[0]

        published = (
            datetime.fromisoformat(published_str.replace("Z", "+00:00")).replace(
                tzinfo=None
            )
            if published_str
            else now
        )
        deadline = (
            datetime.fromisoformat(deadline_str.replace("Z", "+00:00")).replace(
                tzinfo=None
            )
            if deadline_str
            else now + timedelta(days=14)
        )

        categories = raw_data.get("b_category_name", [])
        ai_summary = f"GeM Bid {source_tender_id} for {title} under {ministry}, {dept}. Estimated cost is ₹{cost_lakhs:.2f} Lakhs. Submission deadline is {deadline.strftime('%Y-%m-%d')}."

        # GeM specific enrichment defaults
        cpv_code, unspsc_code = derive_codes(title)
        funding_agency = "Government of India"
        city = None
        consortium_allowed = bool(raw_data.get("b_msme_exemption", False))
        jv_allowed = False
        oem_required = bool(raw_data.get("b_mii", False))
        contract_duration_days = 90
        payment_milestone_count = 1
        penalty_clause = True
        warranty_months = 12
        technical_criteria_raw = None
        financial_criteria_raw = None

    else:  # cppp / state / other
        title = raw_data.get("title", "Live CPPP Notice")
        ministry = raw_data.get("ministry", "Ministry of Electronics and IT")
        dept = raw_data.get("department", "NIC")
        org = raw_data.get("organisation", dept)
        state = raw_data.get("state") or "Delhi"
        try:
            cost_lakhs = float(raw_data.get("estimated_cost_lakhs") or 100.0)
        except (ValueError, TypeError):
            cost_lakhs = 100.0
        try:
            emd = float(raw_data.get("emd_lakhs", 2.0))
        except (ValueError, TypeError):
            emd = 2.0
        try:
            fee = float(raw_data.get("tender_fee", 0.0))
        except (ValueError, TypeError):
            fee = 0.0
        try:
            pbg = float(raw_data.get("performance_guarantee_pct", 5.0))
        except (ValueError, TypeError):
            pbg = 5.0

        method = raw_data.get("procurement_method", "open")
        status = raw_data.get("status", "active")

        published = (
            datetime.fromisoformat(raw_data["published_at"])
            if raw_data.get("published_at")
            else now
        )
        deadline = (
            datetime.fromisoformat(raw_data["submission_deadline"])
            if raw_data.get("submission_deadline")
            else now + timedelta(days=14)
        )
        categories = raw_data.get("categories", ["IT"])
        ai_summary = raw_data.get(
            "ai_summary", f"Tender {source_tender_id} published by {org}."
        )

        # Retrieve new enrichment fields from raw_data
        cpv_code = raw_data.get("cpv_code")
        unspsc_code = raw_data.get("unspsc_code")
        if not cpv_code:
            cpv_code, unspsc_code = derive_codes(title)

        funding_agency = raw_data.get("funding_agency") or "Government of India"
        city = raw_data.get("city")
        consortium_allowed = bool(raw_data.get("consortium_allowed", False))
        jv_allowed = bool(raw_data.get("jv_allowed", False))
        oem_required = bool(raw_data.get("oem_required", False))
        contract_duration_days = (
            raw_data.get("contract_duration_days")
            or raw_data.get("work_completion_days")
            or 180
        )
        payment_milestone_count = raw_data.get("payment_milestone_count") or 0
        penalty_clause = bool(raw_data.get("penalty_clause", False))
        warranty_months = raw_data.get("warranty_months") or 12
        technical_criteria_raw = raw_data.get("technical_criteria_raw")
        financial_criteria_raw = raw_data.get("financial_criteria_raw")

    opening = deadline + timedelta(days=1)

    # Retrieve coordinates
    latitude, longitude = STATE_COORDS.get(state, (28.6139, 77.2090))
    if "latitude" in raw_data and raw_data.get("latitude"):
        latitude = float(raw_data["latitude"])
    if "longitude" in raw_data and raw_data.get("longitude"):
        longitude = float(raw_data["longitude"])

    # 2. Insert or update in PostgreSQL
    pool = await get_db_pool()
    tender_uuid = None
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, dedup_hash FROM tenders WHERE source = $1 AND source_tender_id = $2",
            source_id,
            source_tender_id,
        )

        # Calculate content hash
        new_hash = str(hash(json.dumps(raw_data, sort_keys=True)))

        # Check for duplicates before inserting
        dup_row = await conn.fetchrow(
            """
            SELECT id FROM tenders 
            WHERE status = 'active' AND (
                (LOWER(title) = LOWER($1) AND state = $2 AND ABS(estimated_cost_lakhs - $3) < 0.01)
                OR (source_tender_id = $4 AND source != $5)
            ) LIMIT 1
            """,
            title,
            state,
            cost_lakhs,
            source_tender_id,
            source_id,
        )
        duplicate_of_id = dup_row["id"] if dup_row else None
        dedup_status = "duplicate" if duplicate_of_id else "canonical"

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
                    extraction_tier, extraction_confidence,
                    cpv_code, unspsc_code, funding_agency, city, latitude, longitude,
                    consortium_allowed, jv_allowed, oem_required, contract_duration_days,
                    payment_milestone_count, penalty_clause, warranty_months,
                    technical_criteria_raw, financial_criteria_raw, duplicate_of_id, dedup_status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, 90, 365,
                    $20, $21, $22, $23, $24, $25, $26, 1, 0.95,
                    $27, $28, $29, $30, $31, $32, $33, $34, $35, $36,
                    $37, $38, $39, $40, $41, $42, $43
                )
                """,
                tender_uuid,
                source_id,
                source_tender_id,
                source_url,
                title,
                ministry,
                dept,
                org,
                state,
                cost_lakhs,
                emd,
                fee,
                pbg,
                categories,
                method,
                status,
                published,
                deadline,
                opening,
                cost_lakhs * 0.3,
                2,
                ["ISO 9001"],
                True,
                True,
                ai_summary,
                new_hash,
                cpv_code,
                unspsc_code,
                funding_agency,
                city,
                latitude,
                longitude,
                consortium_allowed,
                jv_allowed,
                oem_required,
                contract_duration_days,
                payment_milestone_count,
                penalty_clause,
                warranty_months,
                technical_criteria_raw,
                financial_criteria_raw,
                duplicate_of_id,
                dedup_status,
            )
            logger.info(
                "Worker inserted new tender to database",
                source_id=source_id,
                source_tender_id=source_tender_id,
                uuid=str(tender_uuid),
                status=dedup_status,
            )

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
                            "ai_summary": ai_summary,
                        },
                        timeout=5.0,
                    )
            except Exception as search_err:
                logger.error(
                    "Worker failed to trigger search index", error=str(search_err)
                )

            # 4. Trigger document pipeline download & OCR
            if document_urls:
                try:
                    async with httpx.AsyncClient() as client:
                        await client.post(
                            f"{DOCUMENT_PIPELINE_URL}/document/process",
                            json={
                                "tender_id": str(tender_uuid),
                                "document_url": document_urls[0],
                                "document_name": f"{source_tender_id.replace('/', '_')}_spec.pdf",
                            },
                            timeout=5.0,
                        )
                except Exception as doc_err:
                    logger.error(
                        "Worker failed to trigger document pipeline", error=str(doc_err)
                    )
        else:
            tender_uuid = row["id"]
            existing_hash = row["dedup_hash"]
            if existing_hash != new_hash:
                await conn.execute(
                    """
                    UPDATE tenders SET
                        title = $1, estimated_cost_lakhs = $2, submission_deadline = $3,
                        dedup_hash = $4, updated_at = NOW(),
                        cpv_code = $5, unspsc_code = $6, funding_agency = $7, city = $8,
                        latitude = $9, longitude = $10, consortium_allowed = $11,
                        jv_allowed = $12, oem_required = $13, contract_duration_days = $14,
                        payment_milestone_count = $15, penalty_clause = $16, warranty_months = $17,
                        duplicate_of_id = $18, dedup_status = $19
                    WHERE id = $20
                    """,
                    title,
                    cost_lakhs,
                    deadline,
                    new_hash,
                    cpv_code,
                    unspsc_code,
                    funding_agency,
                    city,
                    latitude,
                    longitude,
                    consortium_allowed,
                    jv_allowed,
                    oem_required,
                    contract_duration_days,
                    payment_milestone_count,
                    penalty_clause,
                    warranty_months,
                    duplicate_of_id,
                    dedup_status,
                    tender_uuid,
                )
                logger.info(
                    "Worker updated existing tender in database",
                    source_id=source_id,
                    source_tender_id=source_tender_id,
                    uuid=str(tender_uuid),
                )
