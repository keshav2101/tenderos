"""Market Intelligence and Decision routes — proxy to market-intelligence-service."""

from app.config import settings
from app.proxy import ServiceProxy
from fastapi import APIRouter, Request

router = APIRouter()
_intel = ServiceProxy(settings.MARKET_INTEL_SERVICE_URL, timeout=60.0)


@router.get("/trends", summary="Get month-by-month volume trends")
async def get_trends(request: Request):
    return await _intel.get(
        "/trends", params=dict(request.query_params), request=request
    )


@router.post("/decision", summary="Get autonomous bid qualification decision")
async def get_decision(request: Request):
    body = await request.json()
    return await _intel.post("/intelligence/decision", json=body, request=request)


@router.get("/buyers/continuous", summary="Get continuous buyer intelligence alerts")
async def get_continuous_buyers(request: Request):
    return await _intel.get("/intelligence/buyers/continuous", request=request)


@router.get("/suppliers/profiles", summary="Get supplier intelligence profiles")
async def get_supplier_profiles(request: Request):
    return await _intel.get("/intelligence/suppliers/profiles", request=request)


@router.get("/forecasting/cycles", summary="Get procurement cycle forecasts")
async def get_forecasting(request: Request):
    return await _intel.get("/intelligence/forecasting/cycles", request=request)


@router.get("/recommendations/proactive", summary="Get proactive intelligence alerts")
async def get_proactive_recommendations(request: Request):
    return await _intel.get("/intelligence/recommendations/proactive", request=request)
