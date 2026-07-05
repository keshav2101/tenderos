"""Knowledge Graph routes — proxy to knowledge-graph-service."""
from fastapi import APIRouter, Request, Query
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
# We target the knowledge-graph-service URL (we assume KNOWLEDGE_GRAPH_SERVICE_URL config var exists or can map to port 8009)
# Let's verify port or define downstream proxy URL.
_graph = ServiceProxy(settings.ADMIN_SERVICE_URL.replace(":8019", ":8009"), timeout=30.0)


@router.post("/ingest/award", summary="Ingest tender award relations")
async def ingest_award(request: Request):
    body = await request.json()
    return await _graph.post("/graph/ingest/award", json=body, request=request)


@router.get("/query", summary="Query procurement relations from knowledge graph")
async def query_relations(request: Request, source_id: str = Query(...)):
    return await _graph.get(
        "/graph/query",
        params={"source_id": source_id},
        request=request,
    )
