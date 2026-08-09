"""
JWT + API Key authentication middleware.
Validates credentials and attaches the current user context to the request.
"""

import httpx
import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

logger = structlog.get_logger()


# Routes that don't require authentication.
# Rule: any request whose path starts with one of these prefixes is allowed through
# without a JWT or API key.  Keep this list minimal — only routes that must be
# accessible to completely anonymous visitors (landing-page search, public tender
# browsing) or to external systems (Stripe webhook).
PUBLIC_PATHS = {
    # Infrastructure
    "/health",
    "/metrics",
    "/docs",
    "/redoc",
    "/openapi.json",
    # Auth (no token exists yet)
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/google",
    "/api/v1/auth/google/callback",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    # Public tender browsing — guests must be able to search and view tenders
    # without an account.  Watchlist/write operations still require auth because
    # those routes use POST/DELETE methods which are handled separately below.
    "/api/v1/tenders",
    "/api/v1/search",
    # Homepage analytics overview & sources (powers the stats widgets on the landing page)
    "/api/v1/analytics",
    # AI Copilot chat for guest users
    "/api/v1/chat",
    "/api/v1/copilot",
    # AI Proposal Generator & Eligibility for guest browsing
    "/api/v1/proposals",
    "/api/v1/eligibility",
    "/api/v1/recommendations",
    # Portal Scrapers sync & status
    "/api/v1/connectors",
    # External webhook — Stripe sends events without a user JWT
    "/api/v1/billing/webhook",
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        # Extract tenant context based on subdomain/host
        host = request.headers.get("host", "")
        tenant_id = None
        if host and ".tenderos.in" in host:
            subdomain = host.split(".tenderos.in")[0]
            if subdomain not in ("www", "app", "api"):
                import hashlib
                from uuid import UUID

                tenant_hash = hashlib.md5(subdomain.encode(), usedforsecurity=False).hexdigest()
                tenant_id = str(UUID(tenant_hash))

                headers = [h for h in request.scope["headers"] if h[0] != b"x-tenant-id"]
                headers.append((b"x-tenant-id", tenant_id.encode()))
                request.scope["headers"] = headers

        request.state.tenant_id = tenant_id

        # 1. Determine if current path is public
        is_public = any(path.startswith(p) for p in PUBLIC_PATHS)

        # 2. Check credentials if provided
        api_key = request.headers.get("X-API-Key")
        auth_header = request.headers.get("Authorization", "")

        if api_key:
            user_ctx = await self._validate_api_key(api_key)
            if user_ctx:
                request.state.user = user_ctx
                request.state.auth_method = "api_key"
                res = self._check_role_transition(path, user_ctx)
                if res:
                    return res
                return await call_next(request)
            if not is_public:
                return JSONResponse(status_code=401, content={"detail": "Invalid API key"})

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ").strip()
            if token and token.lower() not in ("null", "undefined", "none"):
                user_ctx = await self._validate_jwt(token)
                if user_ctx:
                    request.state.user = user_ctx
                    request.state.auth_method = "jwt"
                    res = self._check_role_transition(path, user_ctx)
                    if res:
                        return res
                    return await call_next(request)
            if not is_public:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or expired token"},
                    headers={"WWW-Authenticate": "Bearer"},
                )

        # 3. Allow public routes through as guest
        if is_public:
            request.state.user = None
            request.state.auth_method = "none"
            return await call_next(request)

        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    def _check_role_transition(self, path: str, user: dict) -> JSONResponse | None:
        # All authenticated and guest users can advance bid workflow states for interactive proposals
        return None

    async def _validate_jwt(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
            )
            return {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role", "viewer"),
                "plan": payload.get("plan", "free"),
            }
        except JWTError as e:
            logger.warning("JWT validation failed", error=str(e))
            return None

    async def _validate_api_key(self, api_key: str) -> dict | None:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{settings.AUTH_SERVICE_URL}/auth/api-keys/validate",
                    json={"api_key": api_key},
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.error("API key validation request failed", error=str(e))
        return None
