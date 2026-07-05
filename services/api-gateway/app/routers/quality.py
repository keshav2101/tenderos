"""Data Quality router proxying downstream requests to data-quality-service."""
from fastapi import APIRouter, Request
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
# We proxy to data-quality-service on port 8022
_quality = ServiceProxy(settings.ADMIN_SERVICE_URL.replace(":8019", ":8022"), timeout=30.0)


@router.get("/report", summary="Get data quality validation reports")
async def get_report(request: Request):
    return await _quality.get("/quality/report", request=request)


@router.get("/metrics", summary="Get data parsing/extraction confidence metrics")
async def get_metrics(request: Request):
    return await _quality.get("/quality/metrics", request=request)
