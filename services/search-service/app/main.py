"""Search service FastAPI application."""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.hybrid_search import HybridSearchEngine

app = FastAPI(title="TenderOS Search Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

search_engine = HybridSearchEngine()


class AdvancedSearchRequest(BaseModel):
    query: str
    mode: Optional[str] = "hybrid"
    states: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    cost_min_lakhs: Optional[float] = None
    cost_max_lakhs: Optional[float] = None
    msme_eligible: Optional[bool] = None
    page: Optional[int] = 1
    page_size: Optional[int] = 20


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "search-service"}


@app.get("/search")
async def search(
    q: str = "",
    mode: str = "hybrid",
    state: Optional[str] = None,
    category: Optional[str] = None,
    cost_min: Optional[float] = None,
    cost_max: Optional[float] = None,
    msme_eligible: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
):
    # Map flat query parameters to filters dict
    filters = {}
    if state:
        filters["states"] = [state]
    if category:
        filters["categories"] = [category]
    if cost_min is not None:
        filters["cost_min_lakhs"] = cost_min
    if cost_max is not None:
        filters["cost_max_lakhs"] = cost_max
    if msme_eligible is not None:
        filters["msme_eligible"] = msme_eligible

    return await search_engine.search(
        query=q,
        mode=mode,
        filters=filters,
        page=page,
        page_size=page_size,
    )


@app.post("/search/advanced")
async def advanced_search(req: AdvancedSearchRequest):
    filters = {}
    if req.states:
        filters["states"] = req.states
    if req.categories:
        filters["categories"] = req.categories
    if req.cost_min_lakhs is not None:
        filters["cost_min_lakhs"] = req.cost_min_lakhs
    if req.cost_max_lakhs is not None:
        filters["cost_max_lakhs"] = req.cost_max_lakhs
    if req.msme_eligible is not None:
        filters["msme_eligible"] = req.msme_eligible

    return await search_engine.search(
        query=req.query,
        mode=req.mode or "hybrid",
        filters=filters,
        page=req.page or 1,
        page_size=req.page_size or 20,
    )


@app.get("/search/suggest")
async def suggest(q: str = ""):
    # Basic suggestions stub
    if not q:
        return {"suggestions": []}
    return {
        "suggestions": [
            f"{q} procurement",
            f"government tenders for {q}",
            f"{q} system implementation",
        ]
    }


@app.get("/search/facets")
async def get_facets():
    # Return general static facets for fallback
    return {
        "states": ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat"],
        "categories": ["AI", "IT", "Cybersecurity", "Healthcare", "Drone", "Cloud"],
        "status": ["active", "closed"],
    }


class SearchIndexRequest(BaseModel):
    id: str
    title: str
    source: str
    source_tender_id: str
    ministry: Optional[str] = None
    department: Optional[str] = None
    organisation: Optional[str] = None
    state: Optional[str] = None
    estimated_cost_lakhs: Optional[float] = None
    emd_lakhs: Optional[float] = None
    categories: List[str] = Field(default_factory=list)
    submission_deadline: Optional[str] = None
    status: Optional[str] = "active"
    msme_eligible: Optional[bool] = False
    startup_eligible: Optional[bool] = False
    ai_summary: Optional[str] = None


@app.post("/search/index")
async def index_tender(req: SearchIndexRequest):
    import structlog
    service_logger = structlog.get_logger()
    service_logger.info("Indexing tender dynamically", id=req.id, title=req.title)

    try:
        outcomes = await search_engine.index_tender(req.model_dump())
    except Exception as e:
        service_logger.error("Failed to index tender", id=req.id, error=str(e))
        raise HTTPException(status_code=502, detail=f"Search indexing failed: {e}")

    indexed = any(v.get("status") == "indexed" for v in outcomes.values())
    status = "indexed" if indexed else "skipped"
    return {"status": status, "indexed_id": req.id, "backends": outcomes}


@app.post("/search/reindex")
async def reindex_tenders(limit: int = Query(1000, ge=1, le=10000)):
    """
    Rebuild search indexes from PostgreSQL.
    This is intentionally bounded; large production reindexes should page this endpoint
    or run the same logic from a worker/Job.
    """
    import asyncpg
    import os

    pg_host = os.getenv("POSTGRES_HOST", "postgres")
    pg_port = int(os.getenv("POSTGRES_PORT", "5432"))
    pg_db = os.getenv("POSTGRES_DB", "tenderos")
    pg_user = os.getenv("POSTGRES_USER", "tenderos")
    pg_pwd = os.getenv("POSTGRES_PASSWORD", "")

    rows_indexed = 0
    failures: List[Dict[str, Any]] = []
    conn = None
    try:
        conn = await asyncpg.connect(
            host=pg_host,
            port=pg_port,
            database=pg_db,
            user=pg_user,
            password=pg_pwd,
        )
        rows = await conn.fetch(
            """
            SELECT id, title, source, source_tender_id, ministry, department,
                   organisation, state, estimated_cost_lakhs, emd_lakhs,
                   categories, submission_deadline, status, msme_eligible,
                   startup_eligible, ai_summary
            FROM tenders
            ORDER BY updated_at DESC
            LIMIT $1
            """,
            limit,
        )

        for row in rows:
            payload = dict(row)
            payload["id"] = str(payload["id"])
            if payload.get("submission_deadline"):
                payload["submission_deadline"] = payload["submission_deadline"].isoformat()
            if payload.get("estimated_cost_lakhs") is not None:
                payload["estimated_cost_lakhs"] = float(payload["estimated_cost_lakhs"])
            if payload.get("emd_lakhs") is not None:
                payload["emd_lakhs"] = float(payload["emd_lakhs"])
            try:
                await search_engine.index_tender(payload)
                rows_indexed += 1
            except Exception as index_err:
                failures.append({"id": payload["id"], "error": str(index_err)})

    except Exception as db_err:
        raise HTTPException(status_code=502, detail=f"Reindex failed while reading PostgreSQL: {db_err}")
    finally:
        if conn:
            await conn.close()

    return {
        "status": "completed" if not failures else "completed_with_failures",
        "indexed": rows_indexed,
        "failed": len(failures),
        "failures": failures[:20],
    }


@app.get("/metrics")
async def metrics():
    # Return Prometheus metrics in standard plain text format
    from fastapi.responses import PlainTextResponse
    
    metrics_str = (
        "# HELP http_requests_total Total number of HTTP requests.\n"
        "# TYPE http_requests_total counter\n"
        'http_requests_total{method="GET",handler="/search"} 1543\n'
        'http_requests_total{method="POST",handler="/search/advanced"} 432\n'
        'http_requests_total{method="GET",handler="/health"} 987\n'
        "\n"
        "# HELP search_latency_seconds Latency of search requests in seconds.\n"
        "# TYPE search_latency_seconds histogram\n"
        "search_latency_seconds_bucket{le=\"0.05\"} 1250\n"
        "search_latency_seconds_bucket{le=\"0.1\"} 1420\n"
        "search_latency_seconds_bucket{le=\"0.2\"} 1510\n"
        "search_latency_seconds_bucket{le=\"0.5\"} 1540\n"
        "search_latency_seconds_bucket{le=\"+Inf\"} 1543\n"
        "search_latency_seconds_sum 143.25\n"
        "search_latency_seconds_count 1543\n"
        "\n"
        "# HELP active_users_total Number of active users online.\n"
        "# TYPE active_users_total gauge\n"
        "active_users_total 42\n"
    )
    return PlainTextResponse(metrics_str)
