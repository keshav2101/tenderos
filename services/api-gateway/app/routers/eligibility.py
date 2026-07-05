"""Eligibility and Recommendations routes."""
from fastapi import APIRouter, Request, Path, Query
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_proxy = ServiceProxy(settings.BID_QUAL_SERVICE_URL)


@router.get("/{tender_id}", summary="Full eligibility + bid qualification report")
async def get_eligibility(request: Request, tender_id: str = Path(...)):
    """
    Returns:
    - Match score (0-100)
    - Eligibility verdict
    - Gap analysis (missing docs, certifications, turnover, experience)
    - Winning probability
    - Recommendation: BID / CONDITIONAL_BID / SKIP
    - Estimated preparation hours
    """
    user = request.state.user
    return await _proxy.get(
        f"/qualify/{tender_id}",
        params={"user_id": user["user_id"]},
    )


@router.post("/bulk", summary="Batch eligibility check for multiple tenders")
async def bulk_eligibility(request: Request):
    user = request.state.user
    body = await request.json()
    body["user_id"] = user["user_id"]
    return await _proxy.post("/qualify/bulk", json=body)
