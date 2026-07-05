"""Search routes — proxy to search-service."""
from fastapi import APIRouter, Request
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_proxy = ServiceProxy(settings.SEARCH_SERVICE_URL)


@router.get("", summary="Hybrid semantic + keyword search")
async def search(request: Request):
    """
    Search tenders using natural language or keywords.

    Examples:
    - `q=AI tenders above 5 crore in Karnataka`
    - `q=cybersecurity tenders closing this week`
    - `q=drone procurement defence`
    """
    params = dict(request.query_params)
    # request.state.user is None for unauthenticated guests (public route)
    user = getattr(request.state, "user", None)
    if user:
        params["company_id"] = user.get("company_id")
    return await _proxy.get("/search", params=params)


@router.post("/advanced", summary="Advanced search with full filter body")
async def advanced_search(request: Request):
    body = await request.json()
    user = getattr(request.state, "user", None)
    if user and "company_id" not in body:
        body["company_id"] = user.get("company_id")
    return await _proxy.post("/search/advanced", json=body)


@router.get("/suggest", summary="Autocomplete query suggestions")
async def suggest(request: Request):
    params = dict(request.query_params)
    return await _proxy.get("/search/suggest", params=params)


@router.get("/facets", summary="Get available filter facets")
async def get_facets():
    return await _proxy.get("/search/facets")
