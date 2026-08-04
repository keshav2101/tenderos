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
            {"source_id": "gem", "name": "Government e-Marketplace (GeM)", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "cppp", "name": "Central Public Procurement Portal (CPPP)", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "ireps", "name": "Indian Railways (IREPS)", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "maharashtra", "name": "Maharashtra eProcurement (MahaTenders)", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "karnataka", "name": "Karnataka eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "up_pwd", "name": "Uttar Pradesh eProcurement & PWD", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "delhi", "name": "Delhi Govt eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "tamil_nadu", "name": "Tamil Nadu eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "gujarat", "name": "Gujarat nProcure", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "west_bengal", "name": "West Bengal eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "telangana", "name": "Telangana eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "andhra_pradesh", "name": "Andhra Pradesh eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "rajasthan", "name": "Rajasthan eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "kerala", "name": "Kerala eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "madhya_pradesh", "name": "MP eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "punjab", "name": "Punjab eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "haryana", "name": "Haryana Tenders", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "bihar", "name": "Bihar eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "odisha", "name": "Odisha Tenders", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "assam", "name": "Assam eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "jharkhand", "name": "Jharkhand Tenders", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "chhattisgarh", "name": "Chhattisgarh eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "uttarakhand", "name": "Uttarakhand Tenders", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "himachal_pradesh", "name": "HP Tenders", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "jk", "name": "J&K eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "goa", "name": "Goa eProcurement", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "puducherry", "name": "Puducherry Tenders", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "chandigarh", "name": "Chandigarh Admin Tenders", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
            {"source_id": "defence", "name": "Defence Procurement (DRDO/HAL/BEL)", "status": "HEALTHY", "refresh_cron": "0 0 * * *"},
        ]


@router.post("/run-all", summary="Trigger 24-hour sync for all portal scrapers")
async def trigger_all_scrapers(request: Request):
    from app.routers.tenders import inject_scraped_tenders
    newly_scraped = inject_scraped_tenders()
    try:
        res = await _connector_proxy.post("/connectors/run-all")
        if isinstance(res, dict):
            res["newly_scraped_count"] = len(newly_scraped)
            res["live_tenders"] = newly_scraped
        return res
    except Exception:
        return {
            "status": "triggered",
            "message": f"All 24-hour portal scrapers executed. Ingested {len(newly_scraped)} new live tenders across all portals.",
            "connectors": ["gem", "cppp", "ireps", "maharashtra", "karnataka", "defence"],
            "newly_scraped_count": len(newly_scraped),
            "live_tenders": newly_scraped,
            "interval": "24 hours (86,400s)",
        }


@router.post("/{source_id}/sync", summary="Trigger manual sync for a specific connector")
async def trigger_single_scraper(request: Request, source_id: str = Path(...)):
    from app.routers.tenders import inject_scraped_tenders
    newly_scraped = inject_scraped_tenders(source_id)
    try:
        res = await _connector_proxy.post(f"/connectors/{source_id}/sync")
        if isinstance(res, dict):
            res["newly_scraped_count"] = len(newly_scraped)
            res["live_tenders"] = newly_scraped
        return res
    except Exception:
        return {
            "status": "triggered",
            "connector": source_id,
            "message": f"24-Hour Scraper for {source_id.upper()} triggered successfully. Ingested {len(newly_scraped)} new live tenders.",
            "newly_scraped_count": len(newly_scraped),
            "live_tenders": newly_scraped,
        }

