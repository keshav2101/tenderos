"""
TenderOS API Gateway
Central entry point for all client requests. Handles:
- JWT authentication and validation
- API key authentication
- Rate limiting (Redis-backed)
- Request routing to downstream services
- Response caching
- Audit logging
- OpenAPI documentation aggregation
- LINTER_REFRESH: Active interpreter libraries indexed.
"""
from contextlib import asynccontextmanager
import time
from typing import Optional

import structlog
from fastapi import FastAPI, Request, Response, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.config import settings
from app.middleware.auth import AuthMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.routers import (
    tenders,
    search,
    analytics,
    recommendations,
    eligibility,
    chat,
    company,
    proposals,
    notifications,
    admin,
    auth,
    health,
    billing,
    graph,
    intelligence,
    governance,
    quality,
)


logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TenderOS API Gateway starting", version=settings.VERSION)
    yield
    logger.info("TenderOS API Gateway shutting down")


app = FastAPI(
    title="TenderOS API",
    description="""
## TenderOS — AI Procurement Intelligence Platform

India's most comprehensive government tender intelligence API.

### Authentication
- **Bearer Token**: `Authorization: Bearer <jwt_token>`
- **API Key**: `X-API-Key: <your_api_key>`

### Rate Limits
| Plan | Requests/Day |
|------|-------------|
| Free | 100 |
| SME  | 10,000 |
| Enterprise | 100,000 |
| API  | Unlimited |
""",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")


# ─── Request timing ──────────────────────────────────────────────────────────

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = str(round(duration_ms, 2))
    response.headers["X-TenderOS-Version"] = settings.VERSION
    
    # Production Security Hardening Headers
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self' http://localhost:8000 http://localhost:3000 http://127.0.0.1:8000 http://127.0.0.1:3000;"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response


# ─── Exception handlers ──────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", path=str(request.url.path), error=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
        },
    )


# ─── Routers ─────────────────────────────────────────────────────────────────

API_V1 = "/api/v1"

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix=f"{API_V1}/auth", tags=["Authentication"])
app.include_router(tenders.router, prefix=f"{API_V1}/tenders", tags=["Tenders"])
app.include_router(search.router, prefix=f"{API_V1}/search", tags=["Search"])
app.include_router(analytics.router, prefix=f"{API_V1}/analytics", tags=["Analytics"])
app.include_router(
    recommendations.router,
    prefix=f"{API_V1}/recommendations",
    tags=["Recommendations"],
)
app.include_router(
    eligibility.router, prefix=f"{API_V1}/eligibility", tags=["Eligibility"]
)
app.include_router(chat.router, prefix=f"{API_V1}/chat", tags=["Tender Copilot"])
app.include_router(company.router, prefix=f"{API_V1}/company", tags=["Company Profile"])
app.include_router(proposals.router, prefix=f"{API_V1}/proposals", tags=["Proposals"])
app.include_router(
    notifications.router,
    prefix=f"{API_V1}/notifications",
    tags=["Notifications"],
)
app.include_router(admin.router, prefix=f"{API_V1}/admin", tags=["Admin"])
app.include_router(billing.router, prefix=f"{API_V1}/billing", tags=["Billing"])
app.include_router(graph.router, prefix=f"{API_V1}/graph", tags=["Knowledge Graph"])
app.include_router(intelligence.router, prefix=f"{API_V1}/intelligence", tags=["Market Intelligence"])
app.include_router(governance.router, prefix=f"{API_V1}/governance", tags=["AI Governance"])
app.include_router(quality.router, prefix=f"{API_V1}/quality", tags=["Data Quality"])
