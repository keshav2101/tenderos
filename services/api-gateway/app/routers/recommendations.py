"""Recommendations router."""

from fastapi import APIRouter, Query, Request

from app.config import settings
from app.proxy import ServiceProxy

router = APIRouter()
_proxy = ServiceProxy(settings.BID_QUAL_SERVICE_URL)


@router.get("", summary="Personalized tender recommendations based on company profile")
async def get_recommendations(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    min_score: int = Query(60, ge=0, le=100),
):
    user = request.state.user
    return await _proxy.get(
        "/recommendations",
        params={"user_id": user["user_id"], "limit": limit, "min_score": min_score},
    )
