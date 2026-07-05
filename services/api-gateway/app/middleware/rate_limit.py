"""
Redis-backed sliding window rate limiter.
Per-user limits based on their plan tier.
"""
import time
import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as aioredis

from app.config import settings

logger = structlog.get_logger()

PLAN_LIMITS = {
    "free": settings.RATE_LIMIT_FREE,
    "sme": settings.RATE_LIMIT_SME,
    "enterprise": settings.RATE_LIMIT_ENTERPRISE,
    "api": settings.RATE_LIMIT_API,
}

UNMETERED_PATHS = {"/health", "/metrics", "/docs", "/redoc", "/openapi.json"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await aioredis.from_url(
                settings.redis_url, decode_responses=True
            )
        return self._redis

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(p) for p in UNMETERED_PATHS):
            return await call_next(request)

        user = getattr(request.state, "user", None)
        plan = user.get("plan", "free") if user else "free"
        plan_status = user.get("plan_status", "active") if user else "active"
        if plan_status not in ("active", "trialing"):
            plan = "free"
        user_id = user.get("user_id", request.client.host) if user else request.client.host

        limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])

        # Unlimited for API plan
        if plan == "api":
            response = await call_next(request)
            return response

        try:
            redis = await self._get_redis()
            key = f"rl:{user_id}:{int(time.time() // 60)}"  # Per-minute window
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, 60)

            remaining = max(0, limit - count)
            if count > limit:
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "limit": limit,
                        "plan": plan,
                        "retry_after_seconds": 60 - int(time.time() % 60),
                    },
                    headers={
                        "Retry-After": str(60 - int(time.time() % 60)),
                        "X-RateLimit-Limit": str(limit),
                    },
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(int(time.time() // 60 + 1) * 60)
            return response

        except Exception as e:
            logger.warning("Rate limiter error, allowing request", error=str(e))
            return await call_next(request)
