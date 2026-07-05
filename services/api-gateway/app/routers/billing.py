"""Billing routes — proxy to billing-service."""
from fastapi import APIRouter, Request
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_proxy = ServiceProxy(settings.BILLING_SERVICE_URL)


@router.post("/checkout", summary="Create subscription checkout session")
async def create_checkout(request: Request):
    body = await request.json()
    user = request.state.user
    body["user_id"] = user["user_id"]
    return await _proxy.post("/billing/checkout", json=body)


@router.post("/portal", summary="Create customer billing portal session")
async def create_portal(request: Request):
    user = request.state.user
    return await _proxy.post("/billing/portal", json={"user_id": user["user_id"]})


@router.post("/webhook", summary="Stripe webhook receiver")
async def stripe_webhook(request: Request):
    # Stripe webhooks are processed raw from the gateway.
    # No auth is performed since it is verified inside billing-service.
    headers = dict(request.headers)
    body = await request.body()
    # In a gateway, we want to forward the raw bytes to preserve signature verification.
    import httpx
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Forward Stripe-Signature
        fwd_headers = {"stripe-signature": headers.get("stripe-signature", "")}
        resp = await client.post(
            f"{settings.BILLING_SERVICE_URL}/billing/webhook",
            content=body,
            headers=fwd_headers,
        )
        if resp.status_code >= 400:
            from fastapi import HTTPException
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()
