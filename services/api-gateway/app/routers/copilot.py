"""Copilot Orchestration routes."""

from app.config import settings
from app.proxy import ServiceProxy
from fastapi import APIRouter, Request

router = APIRouter()
_proxy = ServiceProxy(settings.COPILOT_SERVICE_URL, timeout=60.0)


@router.post("/orchestrate", summary="Orchestrate copilot agents")
async def orchestrate(request: Request):
    """
    Route natural language query to the multi-agent orchestration backend.
    """
    body = await request.json()
    return await _proxy.post("/copilot/orchestrate", json=body, request=request)
