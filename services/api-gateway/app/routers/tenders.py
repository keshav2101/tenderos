"""Tender routes — proxy to tender-service."""

from app.config import settings
from app.proxy import ServiceProxy
from fastapi import APIRouter, HTTPException, Path, Query, Request, status


def _require_user(request: Request) -> dict:
    """Extract the authenticated user or raise 401.

    Watchlist endpoints sit under the /api/v1/tenders prefix which is now
    in PUBLIC_PATHS, so the middleware sets request.state.user = None for
    unauthenticated callers.  Mutating operations must explicitly re-check.
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to manage watchlist",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


router = APIRouter()
_proxy = ServiceProxy(settings.TENDER_SERVICE_URL)


@router.get("/intelligence/buyers", summary="Get buyer profiles")
async def get_buyer_profiles(request: Request, limit: int = Query(20, ge=1, le=100)):
    return await _proxy.get("/tenders/intelligence/buyers", params={"limit": limit}, request=request)


@router.get("/intelligence/market-trends", summary="Get market trends")
async def get_market_trends(request: Request):
    return await _proxy.get("/tenders/intelligence/market-trends", request=request)


@router.get("", summary="List tenders with filters and pagination")
async def list_tenders(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    state: str | None = None,
    ministry: str | None = None,
    department: str | None = None,
    category: str | None = None,
    status: str | None = None,
    msme_eligible: bool | None = None,
    cost_min: float | None = Query(None, description="Min cost in Lakhs"),
    cost_max: float | None = Query(None, description="Max cost in Lakhs"),
    deadline_from: str | None = None,
    deadline_to: str | None = None,
    source: str | None = None,
    sort_by: str = Query(
        "published", enum=["published", "deadline", "cost_high", "cost_low"]
    ),
):
    params = {
        k: v
        for k, v in {
            "page": page,
            "page_size": page_size,
            "state": state,
            "ministry": ministry,
            "department": department,
            "category": category,
            "status": status,
            "msme_eligible": msme_eligible,
            "cost_min": cost_min,
            "cost_max": cost_max,
            "deadline_from": deadline_from,
            "deadline_to": deadline_to,
            "source": source,
            "sort_by": sort_by,
        }.items()
        if v is not None
    }
    return await _proxy.get("/tenders", params=params)


@router.get("/watchlist", summary="List watchlisted tenders")
async def list_watchlist(request: Request):
    user = _require_user(request)
    return await _proxy.get(f"/tenders/watchlist/{user['user_id']}")


@router.get("/{tender_id}", summary="Get tender by ID")
async def get_tender(tender_id: str = Path(...)):
    return await _proxy.get(f"/tenders/{tender_id}")


@router.get("/{tender_id}/summary", summary="Get AI-generated tender summary")
async def get_tender_summary(tender_id: str = Path(...)):
    return await _proxy.get(f"/tenders/{tender_id}/summary")


@router.get("/{tender_id}/similar", summary="Find similar tenders")
async def get_similar_tenders(
    tender_id: str = Path(...), limit: int = Query(5, ge=1, le=20)
):
    return await _proxy.get(f"/tenders/{tender_id}/similar", params={"limit": limit})


@router.get(
    "/{tender_id}/winners", summary="Get award history for this tender category"
)
async def get_winner_history(tender_id: str = Path(...)):
    return await _proxy.get(f"/tenders/{tender_id}/winners")


@router.get("/{tender_id}/documents", summary="Get tender documents list")
async def get_tender_documents(tender_id: str = Path(...)):
    return await _proxy.get(f"/tenders/{tender_id}/documents")


@router.post("/{tender_id}/watchlist", summary="Add tender to watchlist")
async def add_to_watchlist(request: Request, tender_id: str = Path(...)):
    user = _require_user(request)
    return await _proxy.post(
        f"/tenders/{tender_id}/watchlist", json={"user_id": user["user_id"]}
    )


@router.delete("/{tender_id}/watchlist", summary="Remove tender from watchlist")
async def remove_from_watchlist(request: Request, tender_id: str = Path(...)):
    user = _require_user(request)
    return await _proxy.delete(
        f"/tenders/{tender_id}/watchlist?user_id={user['user_id']}"
    )
