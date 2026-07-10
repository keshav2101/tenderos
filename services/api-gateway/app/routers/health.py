"""Health check router — aggregates health from all downstream services.

Service classification:
  CRITICAL  — must all be healthy for overall status = healthy
  OPTIONAL  — tolerated failures; degraded does not affect overall status
"""
import asyncio
from typing import Dict
import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import settings

router = APIRouter()

# These MUST be healthy for the gateway to report "healthy"
CRITICAL_SERVICES = {
    "auth": settings.AUTH_SERVICE_URL,
    "tender": settings.TENDER_SERVICE_URL,
    "search": settings.SEARCH_SERVICE_URL,
    "copilot": settings.COPILOT_SERVICE_URL,
}

# These are best-effort; their failure does not degrade overall status
OPTIONAL_SERVICES = {
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
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{url}/health")
            return {"status": "healthy" if resp.status_code == 200 else "degraded"}
    except Exception:
        return {"status": "unreachable"}


@router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "api-gateway", "version": settings.VERSION}


@router.get("/health/deep", tags=["Health"])
async def deep_health_check():
    # Run all checks concurrently
    critical_names = list(CRITICAL_SERVICES.keys())
    optional_names = list(OPTIONAL_SERVICES.keys())

    critical_tasks = [check_service(n, CRITICAL_SERVICES[n]) for n in critical_names]
    optional_tasks = [check_service(n, OPTIONAL_SERVICES[n]) for n in optional_names]

    critical_results, optional_results = await asyncio.gather(
        asyncio.gather(*critical_tasks),
        asyncio.gather(*optional_tasks),
    )

    critical_services = dict(zip(critical_names, critical_results))
    optional_services = dict(zip(optional_names, optional_results))

    # Overall status: healthy only if ALL critical services are healthy
    critical_healthy = all(v["status"] == "healthy" for v in critical_services.values())
    overall_status = "healthy" if critical_healthy else "degraded"

    # Count optional degradation for transparency
    optional_down = [k for k, v in optional_services.items() if v["status"] != "healthy"]

    return JSONResponse(
        status_code=200,  # Always return 200; callers check body for status
        content={
            "status": overall_status,
            "critical_services": critical_services,
            "optional_services": optional_services,
            "optional_degraded": optional_down,
            "summary": {
                "critical_healthy": sum(1 for v in critical_services.values() if v["status"] == "healthy"),
                "critical_total": len(critical_services),
                "optional_healthy": sum(1 for v in optional_services.values() if v["status"] == "healthy"),
                "optional_total": len(optional_services),
            },
        },
    )
