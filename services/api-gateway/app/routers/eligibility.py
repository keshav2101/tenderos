"""Eligibility and Recommendations routes."""

from fastapi import APIRouter, Path, Request

from app.config import settings
from app.proxy import ServiceProxy

router = APIRouter()
_proxy = ServiceProxy(settings.BID_QUAL_SERVICE_URL)


@router.get("/{tender_id}", summary="Full eligibility + bid qualification report")
async def get_eligibility(request: Request, tender_id: str = Path(...)):
    user = getattr(request.state, "user", None) or {}
    user_id = user.get("user_id", "guest_user")
    return await _proxy.get(
        f"/qualify/{tender_id}",
        params={"user_id": user_id},
    )


@router.post("/bulk", summary="Batch eligibility check for multiple tenders")
async def bulk_eligibility(request: Request):
    user = getattr(request.state, "user", None) or {}
    body = await request.json()
    body["user_id"] = user.get("user_id", "guest_user")
    return await _proxy.post("/qualify/bulk", json=body)
