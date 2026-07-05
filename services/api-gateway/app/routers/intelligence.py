"""Market Intelligence and Decision routes — proxy to market-intelligence-service."""
from fastapi import APIRouter, Request
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_intel = ServiceProxy(settings.MARKET_INTEL_SERVICE_URL, timeout=60.0)


@router.get("/trends", summary="Get month-by-month volume trends")
async def get_trends(request: Request):
    return await _intel.get("/trends", params=dict(request.query_params), request=request)


@router.post("/decision", summary="Get autonomous bid qualification decision")
async def get_decision(request: Request):
    body = await request.json()
    return await _intel.post("/intelligence/decision", json=body, request=request)
