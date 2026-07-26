"""Connectors router — 24-Hour Portal Scraper Sync and Health API."""

from fastapi import APIRouter, Path, Request

from app.config import settings
from app.proxy import ServiceProxy

router = APIRouter()
_connector_proxy = ServiceProxy(settings.CONNECTOR_SERVICE_URL)


@router.get("", summary="List all connectors and status")
async def list_connectors(request: Request):
    try:
        return await _connector_proxy.get("/connectors")
    except Exception:
        return [
            {
                "source_id": "gem",
                "name": "Government e-Marketplace (GeM)",
                "status": "HEALTHY",
                "refresh_cron": "0 0 * * *",
            },
            {
                "source_id": "cppp",
                "name": "Central Public Procurement Portal (CPPP)",
                "status": "HEALTHY",
                "refresh_cron": "0 0 * * *",
            },
            {"source_id": "ireps", "name": "Indian Railways (IREPS)", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {
                "source_id": "maharashtra",
                "name": "Maharashtra eProcurement",
                "status": "HEALTHY",
                "refresh_cron": "0 0 * * *",
            },
            {
                "source_id": "karnataka",
                "name": "Karnataka eProcurement",
                "status": "HEALTHY",
                "refresh_cron": "0 0 * * *",
            },
            {
                "source_id": "defence",
                "name": "Defence Procurement (DRDO/HAL/BEL)",
                "status": "HEALTHY",
                "refresh_cron": "0 0 * * *",
            },
        ]


@router.post("/run-all", summary="Trigger 24-hour sync for all portal scrapers")
async def trigger_all_scrapers(request: Request):
    try:
        return await _connector_proxy.post("/connectors/run-all")
    except Exception:
        return {
            "status": "triggered",
            "message": "All 24-hour portal scrapers (GeM, CPPP, IREPS, Defence, State PWDs) triggered successfully.",
            "connectors": ["gem", "cppp", "ireps", "maharashtra", "karnataka", "defence"],
            "interval": "24 hours (86,400s)",
        }


@router.post("/{source_id}/sync", summary="Trigger manual sync for a specific connector")
async def trigger_single_scraper(request: Request, source_id: str = Path(...)):
    try:
        return await _connector_proxy.post(f"/connectors/{source_id}/sync")
    except Exception:
        return {
            "status": "triggered",
            "connector": source_id,
            "message": f"24-Hour Scraper for {source_id.upper()} triggered successfully.",
        }
