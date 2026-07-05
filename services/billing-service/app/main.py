"""Billing Service FastAPI application with Stripe subscription flows."""
from __future__ import annotations
from datetime import datetime
import json
from typing import Optional
from uuid import UUID

import asyncpg
import stripe
import structlog
from fastapi import FastAPI, HTTPException, Request, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Billing Service", version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stripe.api_key = settings.STRIPE_API_KEY
_pool: Optional[asyncpg.Pool] = None


async def get_db() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            min_size=2,
            max_size=10,
        )
    return _pool


# ─── Pydantic Request Models ──────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    user_id: str
    plan_tier: str  # 'sme' or 'enterprise'

class PortalRequest(BaseModel):
    user_id: str


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "billing-service"}


# ─── Checkout & Portal ────────────────────────────────────────────────────────

@app.post("/billing/checkout")
async def create_checkout_session(req: CheckoutRequest):
    price_id = (
        settings.STRIPE_PRICE_SME
        if req.plan_tier == "sme"
        else settings.STRIPE_PRICE_ENTERPRISE
    )

    pool = await get_db()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT email, stripe_customer_id FROM users WHERE id = $1", UUID(req.user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    customer_id = user["stripe_customer_id"]

    try:
        # If no customer ID in db, create customer on stripe or use email
        kwargs = {}
        if customer_id:
            kwargs["customer"] = customer_id
        else:
            kwargs["customer_email"] = user["email"]

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/dashboard?checkout=success",
            cancel_url=f"{settings.FRONTEND_URL}/pricing?checkout=cancel",
            metadata={"user_id": req.user_id, "plan_tier": req.plan_tier},
            **kwargs,
        )
        return {"checkout_url": session.url}
    except Exception as e:
        logger.error("Failed to create Stripe checkout session", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/billing/portal")
async def create_portal_session(req: PortalRequest):
    pool = await get_db()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT stripe_customer_id FROM users WHERE id = $1", UUID(req.user_id))
        if not user or not user["stripe_customer_id"]:
            raise HTTPException(status_code=400, detail="User has no Stripe customer billing record")

    try:
        session = stripe.billing_portal.Session.create(
            customer=user["stripe_customer_id"],
            return_url=f"{settings.FRONTEND_URL}/dashboard",
        )
        return {"portal_url": session.url}
    except Exception as e:
        logger.error("Failed to create Stripe portal session", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ─── Stripe Webhook ───────────────────────────────────────────────────────────

@app.post("/billing/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    payload = await request.body()
    event = None

    try:
        # Verify webhook signature
        if stripe_signature and settings.STRIPE_WEBHOOK_SECRET != "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
            )
        else:
            # Fallback for dev mode / testing without signatures
            data = json.loads(payload.decode("utf-8"))
            event = stripe.Event.construct_from(data, stripe.api_key)
    except Exception as e:
        logger.error("Invalid webhook payload or signature", error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    event_type = event["type"]
    logger.info("Received Stripe webhook event", type=event_type)

    if event_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        subscription = event["data"]["object"]
        await handle_subscription_change(subscription)

    return {"status": "success"}


async def handle_subscription_change(subscription: dict):
    stripe_sub_id = subscription["id"]
    customer_id = subscription["customer"]
    status_str = subscription["status"]  # active, trialing, past_due, canceled
    price_id = subscription["items"]["data"][0]["price"]["id"]

    # Determine plan type from Price ID
    plan = "free"
    if price_id == settings.STRIPE_PRICE_SME:
        plan = "sme"
    elif price_id == settings.STRIPE_PRICE_ENTERPRISE:
        plan = "enterprise"

    # Get user details from Stripe Metadata if set, or lookup customer_id
    user_id_str = subscription.get("metadata", {}).get("user_id")
    ends_at = datetime.fromtimestamp(subscription.get("current_period_end", 0))

    pool = await get_db()
    async with pool.acquire() as conn:
        if user_id_str:
            user_id = UUID(user_id_str)
            # Update user plan
            await conn.execute(
                """
                UPDATE users
                SET stripe_customer_id = $1, stripe_subscription_id = $2,
                    plan = $3, plan_status = $4, subscription_ends_at = $5,
                    updated_at = NOW()
                WHERE id = $6
                """,
                customer_id, stripe_sub_id, plan, status_str, ends_at, user_id
            )
            logger.info("Updated subscription for user from metadata", user_id=user_id_str, plan=plan, status=status_str)
        else:
            # Fallback: Lookup user by stripe_customer_id
            user = await conn.fetchrow("SELECT id FROM users WHERE stripe_customer_id = $1", customer_id)
            if user:
                await conn.execute(
                    """
                    UPDATE users
                    SET stripe_subscription_id = $1, plan = $2, plan_status = $3,
                        subscription_ends_at = $4, updated_at = NOW()
                    WHERE id = $5
                    """,
                    stripe_sub_id, plan, status_str, ends_at, user["id"]
                )
                logger.info("Updated subscription for customer lookup", customer_id=customer_id, plan=plan, status=status_str)
            else:
                logger.warning("Subscription change received but no user matches customer_id", customer_id=customer_id)
