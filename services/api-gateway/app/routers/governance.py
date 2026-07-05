"""Governance router proxying downstream requests to governance-service."""
from fastapi import APIRouter, Request, Query
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
# We proxy to governance-service on port 8021
_gov = ServiceProxy(settings.ADMIN_SERVICE_URL.replace(":8019", ":8021"), timeout=30.0)


@router.get("/audit", summary="Get recommendation audits trail")
async def get_audit(request: Request, tender_id: str = Query(None)):
    return await _gov.get(
        "/governance/audit",
        params={"tender_id": tender_id} if tender_id else {},
        request=request,
    )


@router.get("/dashboard", summary="Get model statistics & accuracy dashboards")
async def get_dashboard(request: Request):
    return await _gov.get("/governance/dashboard", request=request)
