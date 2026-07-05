"""Notifications router."""
from fastapi import APIRouter, Request
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_proxy = ServiceProxy(settings.NOTIFICATION_SERVICE_URL)


@router.get("", summary="List user notifications")
async def list_notifications(request: Request):
    user = request.state.user
    return await _proxy.get("/notifications", params={"user_id": user["user_id"]})


@router.post("/{notification_id}/read", summary="Mark notification as read")
async def mark_read(request: Request, notification_id: str):
    user = request.state.user
    return await _proxy.post(f"/notifications/{notification_id}/read", json={"user_id": user["user_id"]})


@router.get("/preferences", summary="Get notification preferences")
async def get_preferences(request: Request):
    user = request.state.user
    return await _proxy.get("/preferences", params={"user_id": user["user_id"]})


@router.put("/preferences", summary="Update notification preferences")
async def update_preferences(request: Request):
    user = request.state.user
    body = await request.json()
    body["user_id"] = user["user_id"]
    return await _proxy.put("/preferences", json=body)
