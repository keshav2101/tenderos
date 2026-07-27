"""Tender Service FastAPI application — CRUD, filtering, watchlist."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

import asyncpg
import structlog
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Tender Service", version=settings.VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            min_size=3,
            max_size=20,
        )
    return _pool


@app.on_event("startup")
async def startup_event():
    pool = await get_pool()
    try:
        async with pool.acquire() as conn:
            await conn.execute("DELETE FROM tenders WHERE source IN ('mock', 'demo') OR source ILIKE 'mock%'")
            logger.info("Purged mock tenders from database")
    except Exception as e:
        logger.warning("Could not purge mock tenders on startup", error=str(e))

    import asyncio

    from app.worker import start_queue_worker

    asyncio.create_task(start_queue_worker())


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "tender-service"}


@app.get("/tenders")
async def list_tenders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    state: str | None = None,
    ministry: str | None = None,
    department: str | None = None,
    category: str | None = None,
    status: str | None = "active",
    msme_eligible: bool | None = None,
    startup_eligible: bool | None = None,
    cost_min: float | None = None,
    cost_max: float | None = None,
    deadline_from: str | None = None,
    deadline_to: str | None = None,
    source: str | None = None,
    sort_by: str = "published",
):
    pool = await get_pool()

    # Build dynamic WHERE clause — unconditionally exclude mock/demo sources
    conditions = ["t.source NOT IN ('mock', 'demo')", "t.source NOT ILIKE 'mock%'"]
    params = []
    idx = 1

    if q and q.strip():
        conditions.append(
            f"(t.title ILIKE ${idx} OR t.ministry ILIKE ${idx} OR t.department ILIKE ${idx} OR t.organisation ILIKE ${idx} OR t.ai_summary ILIKE ${idx})"
        )
        params.append(f"%{q.strip()}%")
        idx += 1
    if state:
        conditions.append(f"t.state ILIKE ${idx}")
        params.append(f"%{state}%")
        idx += 1
    if ministry:
        conditions.append(f"t.ministry ILIKE ${idx}")
        params.append(f"%{ministry}%")
        idx += 1
    if department:
        conditions.append(f"t.department ILIKE ${idx}")
        params.append(f"%{department}%")
        idx += 1
    if category:
        cat_terms = [category]
        cat_upper = category.upper()
        if "TECH" in cat_upper or "IT" in cat_upper:
            cat_terms.extend(
                ["IT", "AI", "Cloud", "Cybersecurity", "GIS", "Software", "Data Analytics", "IoT", "Smart City"]
            )
        elif "INFRA" in cat_upper or "CIVIL" in cat_upper:
            cat_terms.extend(["Construction", "Infrastructure", "Civil", "Smart City"])
        elif "DEFENCE" in cat_upper or "AERO" in cat_upper:
            cat_terms.extend(["Defence", "Drone", "Aerospace"])
        elif "RAIL" in cat_upper or "MOBILITY" in cat_upper:
            cat_terms.extend(["Railways", "Mobility", "Transport", "IoT"])
        elif "HEALTH" in cat_upper or "MED" in cat_upper:
            cat_terms.extend(["Healthcare", "Medical Equipment", "Medical"])
        elif "ENERGY" in cat_upper or "POWER" in cat_upper:
            cat_terms.extend(["Renewable Energy", "Energy", "Power"])
        elif "EDU" in cat_upper:
            cat_terms.extend(["Education", "Training"])
        elif "SEC" in cat_upper:
            cat_terms.extend(["Cybersecurity", "Surveillance", "Security", "Drone"])

        conditions.append(f"t.categories && ${idx}")
        params.append(cat_terms)
        idx += 1
    if status and status.lower() != "all":
        conditions.append(f"t.status = ${idx}")
        params.append(status)
        idx += 1
    if msme_eligible is not None:
        conditions.append(f"t.msme_eligible = ${idx}")
        params.append(msme_eligible)
        idx += 1
    if startup_eligible is not None:
        conditions.append(f"t.startup_eligible = ${idx}")
        params.append(startup_eligible)
        idx += 1
    if cost_min is not None:
        conditions.append(f"t.estimated_cost_lakhs >= ${idx}")
        params.append(cost_min)
        idx += 1
    if cost_max is not None:
        conditions.append(f"t.estimated_cost_lakhs <= ${idx}")
        params.append(cost_max)
        idx += 1
    if deadline_from:
        conditions.append(f"t.submission_deadline >= ${idx}")
        params.append(deadline_from)
        idx += 1
    if deadline_to:
        conditions.append(f"t.submission_deadline <= ${idx}")
        params.append(deadline_to)
        idx += 1
    # FIX: column is `source` not `source_id`
    if source:
        conditions.append(f"t.source = ${idx}")
        params.append(source)
        idx += 1

    # Sort
    sort_map = {
        "published": "t.published_at DESC",
        "deadline": "t.submission_deadline ASC",
        "cost_high": "t.estimated_cost_lakhs DESC",
        "cost_low": "t.estimated_cost_lakhs ASC",
    }
    order_by = sort_map.get(sort_by, "t.published_at DESC")

    where_clause = " AND ".join(conditions)
    offset = (page - 1) * page_size

    async with pool.acquire() as conn:
        # Total count
        count_row = await conn.fetchrow(
            f"SELECT COUNT(*) FROM tenders t WHERE {where_clause}",
            *params,
        )
        total = count_row["count"]

        # Fetch page
        rows = await conn.fetch(
            f"""
            SELECT t.id, t.title, t.ministry, t.department, t.organisation,
                   t.state, t.categories, t.estimated_cost_lakhs, t.emd_lakhs,
                   t.submission_deadline, t.status, t.source, t.msme_eligible,
                   t.startup_eligible, t.source_url, t.source_tender_id,
                   t.ai_summary, t.published_at, t.procurement_method
            FROM tenders t
            WHERE {where_clause}
            ORDER BY {order_by}
            LIMIT ${idx} OFFSET ${idx + 1}
            """,
            *params,
            page_size,
            offset,
        )

    tenders = [dict(r) for r in rows]
    # Serialize UUIDs
    for t in tenders:
        for k, v in t.items():
            if isinstance(v, UUID):
                t[k] = str(v)
            elif isinstance(v, datetime):
                t[k] = v.isoformat()

    return {
        "tenders": tenders,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


# ─── PHASE 5: PROCUREMENT INTELLIGENCE ENGINE ENDPOINTS ──────────────────────


@app.get("/tenders/intelligence/buyers")
async def get_buyer_profiles(limit: int = 20):
    """Nightly aggregated buyer profiles across Indian ministries, PSUs, and state bodies."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                COALESCE(organisation, ministry, department, 'General Procurement') as buyer_name,
                COALESCE(ministry, 'Central / State Portal') as ministry_name,
                COUNT(*) as total_tenders,
                ROUND(SUM(COALESCE(estimated_cost_lakhs, 0))::numeric, 2) as total_value_lakhs,
                ROUND(AVG(COALESCE(estimated_cost_lakhs, 0))::numeric, 2) as avg_tender_val_lakhs,
                COUNT(*) FILTER (WHERE msme_eligible = true) as msme_friendly_count
            FROM tenders
            WHERE status = 'active'
            GROUP BY COALESCE(organisation, ministry, department, 'General Procurement'), COALESCE(ministry, 'Central / State Portal')
            ORDER BY total_tenders DESC
            LIMIT $1
            """,
            limit,
        )
        profiles = []
        for r in rows:
            d = dict(r)
            d["total_value_lakhs"] = float(d["total_value_lakhs"]) if d["total_value_lakhs"] is not None else 0.0
            d["avg_tender_val_lakhs"] = (
                float(d["avg_tender_val_lakhs"]) if d["avg_tender_val_lakhs"] is not None else 0.0
            )
            profiles.append(d)
        return {"buyer_profiles": profiles, "total": len(profiles)}


@app.get("/tenders/intelligence/market-trends")
async def get_market_trends():
    """Aggregated market intelligence, state distribution, and spending breakdowns."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        state_rows = await conn.fetch(
            """
            SELECT COALESCE(state, 'Pan-India') as state_name, COUNT(*) as tender_count
            FROM tenders
            GROUP BY COALESCE(state, 'Pan-India')
            ORDER BY tender_count DESC
            LIMIT 15
            """
        )
        source_rows = await conn.fetch(
            """
            SELECT source, COUNT(*) as tender_count
            FROM tenders
            GROUP BY source
            ORDER BY tender_count DESC
            """
        )
        msme_count = await conn.fetchval("SELECT COUNT(*) FROM tenders WHERE msme_eligible = true")
        total_tenders = await conn.fetchval("SELECT COUNT(*) FROM tenders")

        return {
            "total_tenders": total_tenders,
            "msme_exemption_rate": round((msme_count / max(1, total_tenders)) * 100, 1),
            "state_distribution": [dict(r) for r in state_rows],
            "source_distribution": [dict(r) for r in source_rows],
        }


@app.get("/tenders/{tender_id}/opportunity-score")
async def calculate_opportunity_score(tender_id: str):
    """Calculate 0-100 win probability and qualification fit score for a specific tender."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM tenders WHERE id = $1", UUID(tender_id))
        if not row:
            raise HTTPException(status_code=404, detail="Tender not found")

        t = dict(row)
        score = 70  # Baseline score for verified live tenders
        factors = []

        if t.get("msme_eligible"):
            score += 12
            factors.append(
                {
                    "factor": "MSME / Udyam Benefits",
                    "impact": "+12",
                    "detail": "EMD Waiver & 15% Purchase Preference applicable",
                }
            )

        if t.get("source") in ["gem", "cppp", "ireps"]:
            score += 8
            factors.append(
                {
                    "factor": "Tier-1 Central Portal",
                    "impact": "+8",
                    "detail": "Direct e-bidding & transparent evaluation",
                }
            )

        if t.get("estimated_cost_lakhs") and t["estimated_cost_lakhs"] > 0:
            score += 5
            factors.append(
                {
                    "factor": "Clear Value Disclosed",
                    "impact": "+5",
                    "detail": f"Budget: ₹{t['estimated_cost_lakhs']} Lakhs",
                }
            )

        final_score = min(98, score)
        return {
            "tender_id": tender_id,
            "opportunity_score": final_score,
            "match_grade": ("A+" if final_score >= 85 else "A" if final_score >= 75 else "B"),
            "scoring_factors": factors,
            "mii_compliance": "Class-I Local Supplier Preference",
            "emd_waiver_eligible": t.get("msme_eligible", False),
        }


@app.get("/tenders/{tender_id}")
async def get_tender(tender_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM tenders WHERE id = $1", UUID(tender_id))
        if not row:
            raise HTTPException(status_code=404, detail="Tender not found")
        data = dict(row)
        for k, v in data.items():
            if isinstance(v, UUID):
                data[k] = str(v)
            elif isinstance(v, datetime):
                data[k] = v.isoformat()
        return data


@app.get("/tenders/{tender_id}/summary")
async def get_tender_summary(tender_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, title, ai_summary, key_points FROM tenders WHERE id = $1",
            UUID(tender_id),
        )
        if not row:
            raise HTTPException(status_code=404, detail="Tender not found")
        return dict(row)


@app.get("/tenders/{tender_id}/similar")
async def get_similar_tenders(tender_id: str, limit: int = 5):
    """Find tenders with overlapping categories."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        source = await conn.fetchrow(
            "SELECT categories, ministry FROM tenders WHERE id = $1",
            UUID(tender_id),
        )
        if not source:
            raise HTTPException(status_code=404, detail="Tender not found")

        rows = await conn.fetch(
            """
            SELECT id, title, ministry, estimated_cost_lakhs, submission_deadline, categories, status
            FROM tenders
            WHERE id != $1
              AND status = 'active'
              AND categories && $2
            ORDER BY (SELECT COUNT(*) FROM unnest(categories) c WHERE c = ANY($2)) DESC, published_at DESC
            LIMIT $3
            """,
            UUID(tender_id),
            source["categories"],
            limit,
        )
        return [dict(r) for r in rows]


@app.post("/tenders/{tender_id}/watchlist")
async def add_to_watchlist(tender_id: str, body: dict):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # FIX: table is `watchlists`, column is `created_at` not `added_at`
        await conn.execute(
            """
            INSERT INTO watchlists (user_id, tender_id, notes, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, tender_id) DO NOTHING
            """,
            UUID(body["user_id"]),
            UUID(tender_id),
            body.get("notes", ""),
            datetime.utcnow(),
        )
    return {"message": "Added to watchlist"}


@app.delete("/tenders/{tender_id}/watchlist")
async def remove_from_watchlist(tender_id: str, user_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # FIX: table is `watchlists`
        await conn.execute(
            "DELETE FROM watchlists WHERE user_id = $1 AND tender_id = $2",
            UUID(user_id),
            UUID(tender_id),
        )
    return {"message": "Removed from watchlist"}


@app.get("/tenders/watchlist/{user_id}")
async def list_watchlist(user_id: str):
    pool = await get_pool()
    from datetime import datetime
    from uuid import UUID

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT t.id, t.title, t.ministry, t.department, t.organisation,
                   t.state, t.categories, t.estimated_cost_lakhs, t.emd_lakhs,
                   t.submission_deadline, t.status, t.source, t.msme_eligible,
                   t.startup_eligible, t.source_url, t.source_tender_id,
                   t.ai_summary, t.published_at, t.procurement_method
            FROM watchlists w
            JOIN tenders t ON w.tender_id = t.id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC
            """,
            UUID(user_id),
        )
    tenders = [dict(r) for r in rows]
    for t in tenders:
        for k, v in t.items():
            if isinstance(v, UUID):
                t[k] = str(v)
            elif isinstance(v, datetime):
                t[k] = v.isoformat()
    return tenders
