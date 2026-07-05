"""Notification service FastAPI application."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict
from uuid import uuid4
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.dispatcher import SlackDispatcher, TwilioDispatcher

app = FastAPI(title="TenderOS Notification Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# Instantiate Twilio dispatcher (can read from env or use defaults)
twilio_dispatcher = TwilioDispatcher()


class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    notification_type: str  # match, deadline, corrigendum, system


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
    # Returns simulated user notifications
    return [
        {
            "id": "notif-001",
            "title": "New Tender Match: AI-based Fraud Detection",
            "message": "A new tender matching your profile has been issued by the Ministry of Finance. Match score: 94%.",
            "type": "match",
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
        },
        {
            "id": "notif-002",
            "title": "Closing Soon: SOC Setup at AIIMS Delhi",
            "message": "Tender 'Security Operations Centre (SOC) Setup — AIIMS Delhi' closes in 7 days. Your win probability is 62%.",
            "type": "deadline",
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
        },
        {
            "id": "notif-003",
            "title": "Sync Job Completed",
            "message": "Connector 'GeM Bids' completed successfully. 12 new tenders found.",
            "type": "system",
            "read": True,
            "created_at": datetime.utcnow().isoformat(),
        },
    ]


@app.post("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, body: dict):
    return {"status": "success", "message": f"Notification {notification_id} marked as read"}


@app.get("/preferences")
async def get_preferences(user_id: str):
    return {
        "user_id": user_id,
        "email_alerts": True,
        "whatsapp_alerts": False,
        "weekly_digest": True,
        "categories": ["AI", "IT", "Cybersecurity", "Data Analytics"],
    }


@app.put("/preferences")
async def update_preferences(req: UpdatePreferencesRequest):
    return {"status": "success", "message": "Preferences updated successfully"}


@app.post("/notifications/send")
async def send_notification(req: SendNotificationRequest):
    # 1. Fetch user preference profile (mocked for development)
    # In production, query the PostgreSQL notification_preferences table.
    prefs = {
        "email_enabled": True,
        "sms_enabled": True,
        "whatsapp_enabled": False,
        "slack_webhook_url": "",
        "phone_number": "+919876543210"
    }

    channels_sent = []

    # 2. Email Channel
    if prefs["email_enabled"]:
        # Simulated email send
        channels_sent.append("email")

    # 3. SMS Channel
    if prefs["sms_enabled"] and prefs.get("phone_number"):
        sms_ok = await twilio_dispatcher.send_sms(
            to_number=prefs["phone_number"],
            text=f"{req.title}: {req.body}"
        )
        if sms_ok:
            channels_sent.append("sms")

    # 4. WhatsApp Channel
    if prefs["whatsapp_enabled"] and prefs.get("phone_number"):
        wa_ok = await twilio_dispatcher.send_whatsapp(
            to_number=prefs["phone_number"],
            text=f"{req.title}: {req.body}"
        )
        if wa_ok:
            channels_sent.append("whatsapp")

    # 5. Slack Channel
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
