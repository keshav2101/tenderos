"""Chat (Tender Copilot) routes."""
from fastapi import APIRouter, Request, Path
from pydantic import BaseModel
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_proxy = ServiceProxy(settings.COPILOT_SERVICE_URL, timeout=60.0)


class ChatMessage(BaseModel):
    message: str
    conversation_id: str | None = None


@router.post("/{tender_id}", summary="Ask the Tender Copilot a question")
async def chat(request: Request, tender_id: str = Path(...), body: ChatMessage = ...):
    """
    Chat with the AI Copilot about a specific tender.

    Questions it can answer:
    - "What documents are mandatory?"
    - "Is MSME exempt from EMD?"
    - "Explain Clause 7.3"
    - "What are the payment terms?"
    - "Show all penalties"
    """
    user = request.state.user
    payload = {
        "tender_id": tender_id,
        "message": body.message,
        "conversation_id": body.conversation_id,
        "user_id": user["user_id"],
    }
    return await _proxy.post(f"/chat/{tender_id}", json=payload)


@router.get("/{tender_id}/history", summary="Get conversation history for a tender")
async def get_history(request: Request, tender_id: str = Path(...)):
    user = request.state.user
    return await _proxy.get(
        f"/chat/{tender_id}/history",
        params={"user_id": user["user_id"]},
    )


@router.delete("/{tender_id}/history", summary="Clear conversation history")
async def clear_history(request: Request, tender_id: str = Path(...)):
    user = request.state.user
    return await _proxy.delete(
        f"/chat/{tender_id}/history?user_id={user['user_id']}"
    )
