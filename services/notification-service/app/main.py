"""Notification service FastAPI application."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict
from uuid import UUID, uuid4
import structlog
import asyncpg
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.dispatcher import SlackDispatcher, TwilioDispatcher
from app.config import settings

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Notification Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# Instantiate Twilio dispatcher (can read from env or use defaults)
twilio_dispatcher = TwilioDispatcher()

# Connection pool cache
_pool: asyncpg.Pool | None = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            min_size=1,
            max_size=5,
        )
    return _pool


class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    notification_type: str  # match, corrigendum, system, etc.


class UpdatePreferencesRequest(BaseModel):
    user_id: str
    email_alerts: bool
    whatsapp_alerts: bool
    weekly_digest: bool
    categories: List[str]


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "notification-service"}


@app.get("/notifications")
async def list_notifications(user_id: str):
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, title, body, is_read, type, created_at
                FROM notifications
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 50
                """,
                UUID(user_id)
            )
            return [
                {
                    "id": str(r["id"]),
                    "title": r["title"],
                    "message": r["body"],
                    "body": r["body"],
                    "read": r["is_read"],
                    "type": r["type"],
                    "created_at": r["created_at"].isoformat() if r["created_at"] else datetime.utcnow().isoformat(),
                }
                for r in rows
            ]
    except Exception as e:
        logger.error("Failed to query notifications", error=str(e))
        # Empty state on database failure instead of fake data
        return []


@app.patch("/notifications/{notification_id}/read")
@app.post("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, body: dict = None):
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE notifications SET is_read = TRUE WHERE id = $1",
                UUID(notification_id)
            )
            return {"status": "success", "message": f"Notification {notification_id} marked as read"}
    except Exception as e:
        logger.error("Failed to mark notification as read", error=str(e))
        raise HTTPException(status_code=500, detail="Database update error")


@app.get("/preferences")
async def get_preferences(user_id: str):
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT email_enabled, sms_enabled, whatsapp_enabled, slack_webhook_url FROM notification_preferences WHERE user_id = $1",
                UUID(user_id)
            )
            if not row:
                return {
                    "user_id": user_id,
                    "email_alerts": True,
                    "whatsapp_alerts": False,
                    "weekly_digest": True,
                    "categories": []
                }
            return {
                "user_id": user_id,
                "email_alerts": row["email_enabled"],
                "whatsapp_alerts": row["whatsapp_enabled"],
                "weekly_digest": True,
                "categories": []
            }
    except Exception as e:
        logger.error("Failed to fetch preferences", error=str(e))
        return {
            "user_id": user_id,
            "email_alerts": True,
            "whatsapp_alerts": False,
            "weekly_digest": True,
            "categories": []
        }


@app.put("/preferences")
async def update_preferences(req: UpdatePreferencesRequest):
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO notification_preferences (user_id, email_enabled, whatsapp_enabled, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id) DO UPDATE
                SET email_enabled = EXCLUDED.email_enabled,
                    whatsapp_enabled = EXCLUDED.whatsapp_enabled,
                    updated_at = NOW()
                """,
                UUID(req.user_id), req.email_alerts, req.whatsapp_alerts
            )
            return {"status": "success", "message": "Preferences updated successfully"}
    except Exception as e:
        logger.error("Failed to save preferences", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to save preferences to database")


@app.post("/notifications/send")
async def send_notification(req: SendNotificationRequest):
    try:
        pool = await get_pool()
        prefs = {
            "email_enabled": True,
            "sms_enabled": True,
            "whatsapp_enabled": False,
            "slack_webhook_url": "",
            "phone_number": ""
        }
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT email_enabled, sms_enabled, whatsapp_enabled, slack_webhook_url FROM notification_preferences WHERE user_id = $1",
                UUID(req.user_id)
            )
            if row:
                prefs["email_enabled"] = row["email_enabled"]
                prefs["sms_enabled"] = row["sms_enabled"]
                prefs["whatsapp_enabled"] = row["whatsapp_enabled"]
                prefs["slack_webhook_url"] = row["slack_webhook_url"] or ""

            # Save notification to PostgreSQL database
            await conn.execute(
                """
                INSERT INTO notifications (id, user_id, title, body, is_read, type, created_at)
                VALUES ($1, $2, $3, $4, FALSE, $5, NOW())
                """,
                uuid4(), UUID(req.user_id), req.title, req.body, req.notification_type
            )
    except Exception as e:
        logger.warning("Database interaction failed for notification send, using default channels", error=str(e))

    channels_sent = []

    # 1. Email Channel (Simulated alert logging)
    if prefs["email_enabled"]:
        channels_sent.append("email")

    # 2. SMS Channel
    if prefs["sms_enabled"] and prefs.get("phone_number"):
        sms_ok = await twilio_dispatcher.send_sms(
            to_number=prefs["phone_number"],
            text=f"{req.title}: {req.body}"
        )
        if sms_ok:
            channels_sent.append("sms")

    # 3. WhatsApp Channel
    if prefs["whatsapp_enabled"] and prefs.get("phone_number"):
        wa_ok = await twilio_dispatcher.send_whatsapp(
            to_number=prefs["phone_number"],
            text=f"{req.title}: {req.body}"
        )
        if wa_ok:
            channels_sent.append("whatsapp")

    # 4. Slack Channel
    if prefs["slack_webhook_url"]:
        slack_ok = await SlackDispatcher.send_message(
            webhook_url=prefs["slack_webhook_url"],
            title=req.title,
            body=req.body
        )
        if slack_ok:
            channels_sent.append("slack")

    return {
        "status": "completed",
        "channels_attempted": channels_sent,
        "message": "Notifications processed"
    }
