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


@router.post("/chat/{tender_id}", summary="Ask the Tender Copilot a question")
async def chat_tender(request: Request, tender_id: str):
    """
    Proxy chat requests for specific tenders to copilot-service.
    """
    body = await request.json()
    message = body.get("message") or body.get("query") or ""
    payload = {
        "tender_id": tender_id,
        "message": message,
        "query": message,
        "user_id": body.get("user_id", "guest"),
        "conversation_id": body.get("conversation_id"),
    }
    return await _proxy.post(f"/chat/{tender_id}", json=payload, request=request)
