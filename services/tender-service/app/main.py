"""Tender Service FastAPI application — CRUD, filtering, watchlist."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from uuid import UUID

import asyncpg
import structlog
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Tender Service", version=settings.VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST, port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB, user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD, min_size=3, max_size=20,
        )
    return _pool


@app.on_event("startup")
async def startup_event():
    await get_pool()
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
    state: Optional[str] = None,
    ministry: Optional[str] = None,
    department: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = "active",
    msme_eligible: Optional[bool] = None,
    cost_min: Optional[float] = None,
    cost_max: Optional[float] = None,
    deadline_from: Optional[str] = None,
    deadline_to: Optional[str] = None,
    source: Optional[str] = None,
    sort_by: str = "published",
):
    pool = await get_pool()

    # Build dynamic WHERE clause
    conditions = ["1=1"]
    params = []
    idx = 1

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
        conditions.append(f"${idx} = ANY(t.categories)")
        params.append(category)
        idx += 1
    if status:
        conditions.append(f"t.status = ${idx}")
        params.append(status)
        idx += 1
    if msme_eligible is not None:
        conditions.append(f"t.msme_eligible = ${idx}")
        params.append(msme_eligible)
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
                   t.ai_summary, t.published_at, t.procurement_method
            FROM tenders t
            WHERE {where_clause}
            ORDER BY {order_by}
            LIMIT ${idx} OFFSET ${idx + 1}
            """,
            *params, page_size, offset,
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
            ORDER BY array_length(categories & $2, 1) DESC, published_at DESC
            LIMIT $3
            """,
            UUID(tender_id), source["categories"], limit,
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
            UUID(body["user_id"]), UUID(tender_id), body.get("notes", ""), datetime.utcnow(),
        )
    return {"message": "Added to watchlist"}


@app.delete("/tenders/{tender_id}/watchlist")
async def remove_from_watchlist(tender_id: str, user_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # FIX: table is `watchlists`
        await conn.execute(
            "DELETE FROM watchlists WHERE user_id = $1 AND tender_id = $2",
            UUID(user_id), UUID(tender_id),
        )
    return {"message": "Removed from watchlist"}


@app.get("/tenders/watchlist/{user_id}")
async def list_watchlist(user_id: str):
    pool = await get_pool()
    from uuid import UUID
    from datetime import datetime
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT t.id, t.title, t.ministry, t.department, t.organisation,
                   t.state, t.categories, t.estimated_cost_lakhs, t.emd_lakhs,
                   t.submission_deadline, t.status, t.source, t.msme_eligible,
                   t.ai_summary, t.published_at, t.procurement_method
            FROM watchlists w
            JOIN tenders t ON w.tender_id = t.id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC
            """,
            UUID(user_id)
        )
    tenders = [dict(r) for r in rows]
    for t in tenders:
        for k, v in t.items():
            if isinstance(v, UUID):
                t[k] = str(v)
            elif isinstance(v, datetime):
                t[k] = v.isoformat()
    return tenders
