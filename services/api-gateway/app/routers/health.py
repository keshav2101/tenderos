"""Health check router — aggregates health from all downstream services."""
import asyncio
from typing import Dict
import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import settings

router = APIRouter()

DOWNSTREAM_SERVICES = {
    "auth": settings.AUTH_SERVICE_URL,
    "tender": settings.TENDER_SERVICE_URL,
    "search": settings.SEARCH_SERVICE_URL,
    "copilot": settings.COPILOT_SERVICE_URL,
    "digital-twin": settings.DIGITAL_TWIN_SERVICE_URL,
    "bid-qualification": settings.BID_QUAL_SERVICE_URL,
    "market-intelligence": settings.MARKET_INTEL_SERVICE_URL,
    "prediction": settings.PREDICTION_SERVICE_URL,
    "competitor": settings.COMPETITOR_SERVICE_URL,
    "proposal": settings.PROPOSAL_SERVICE_URL,
    "notification": settings.NOTIFICATION_SERVICE_URL,
    "admin": settings.ADMIN_SERVICE_URL,
}


async def check_service(name: str, url: str) -> Dict:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{url}/health")
            return {"status": "healthy" if resp.status_code == 200 else "degraded"}
    except Exception:
        return {"status": "unreachable"}


@router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "api-gateway", "version": settings.VERSION}


@router.get("/health/deep", tags=["Health"])
async def deep_health_check():
    tasks = [check_service(name, url) for name, url in DOWNSTREAM_SERVICES.items()]
    results = await asyncio.gather(*tasks)
    services = dict(zip(DOWNSTREAM_SERVICES.keys(), results))
    all_healthy = all(v["status"] == "healthy" for v in services.values())
    return JSONResponse(
        status_code=200 if all_healthy else 207,
        content={"status": "healthy" if all_healthy else "degraded", "services": services},
    )
