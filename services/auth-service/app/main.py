"""Auth Service FastAPI application."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

import structlog
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import asyncpg

from app.config import settings
from app.auth_service import AuthService

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Auth Service", version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_svc = AuthService()
_pool: Optional[asyncpg.Pool] = None


async def get_db() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST, port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB, user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD, min_size=2, max_size=10,
        )
    return _pool


# ─── Request/Response Models ──────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str                          # FIX: was full_name — matches DB column
    company_name: Optional[str] = None

    def validated_password(self) -> str:
        """Bcrypt max is 72 bytes — enforce a safe max of 64 chars."""
        if len(self.password) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(self.password.encode()) > 64:
            raise ValueError("Password must not exceed 64 characters")
        return self.password

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class CreateAPIKeyRequest(BaseModel):
    user_id: str
    name: str
    scopes: list[str] = ["read"]  # stored in metadata, not a DB column

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ValidateAPIKeyRequest(BaseModel):
    api_key: str


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth-service"}


@app.post("/auth/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest):
    # Validate password before any DB work
    try:
        req.validated_password()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    pool = await get_db()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", req.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = uuid4()
        hashed_pw = auth_svc.hash_password(req.password)
        now = datetime.utcnow()

        user = await conn.fetchrow(
            """
            INSERT INTO users (id, email, password_hash, name, role, plan, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'viewer', 'free', $5, $5)
            RETURNING id, email, name, role, plan, company_id
            """,
            user_id, req.email, hashed_pw, req.name, now,
        )

        user_dict = dict(user)
        user_dict = {k: str(v) if isinstance(v, UUID) else v for k, v in user_dict.items()}
        access = auth_svc.create_access_token(user_dict)
        refresh = auth_svc.create_refresh_token(str(user_id))
        logger.info("User registered", user_id=str(user_id), email=req.email)
        return TokenResponse(access_token=access, refresh_token=refresh, user=user_dict)


@app.post("/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    pool = await get_db()
    async with pool.acquire() as conn:
        # FIX: column is `name`, not `full_name`
        user = await conn.fetchrow(
            "SELECT id, email, password_hash, name, role, plan, company_id FROM users WHERE email = $1",
            req.email,
        )
        if not user or not auth_svc.verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # FIX: column is `last_login_at`, not `last_login`
        await conn.execute("UPDATE users SET last_login_at = $1 WHERE id = $2", datetime.utcnow(), user["id"])

        user_dict = {k: str(v) if isinstance(v, UUID) else v for k, v in dict(user).items() if k != "password_hash"}
        access = auth_svc.create_access_token(user_dict)
        refresh = auth_svc.create_refresh_token(str(user["id"]))
        return TokenResponse(access_token=access, refresh_token=refresh, user=user_dict)


@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(req: RefreshRequest):
    payload = auth_svc.decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    jti = payload.get("jti")
    if jti and await auth_svc.is_token_revoked(jti):
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")

    pool = await get_db()
    async with pool.acquire() as conn:
        # FIX: column is `name`
        user = await conn.fetchrow(
            "SELECT id, email, name, role, plan, company_id FROM users WHERE id = $1",
            UUID(payload["sub"]),
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Rotate refresh token
        await auth_svc.revoke_refresh_token(req.refresh_token)
        user_dict = {k: str(v) if isinstance(v, UUID) else v for k, v in dict(user).items()}
        access = auth_svc.create_access_token(user_dict)
        new_refresh = auth_svc.create_refresh_token(str(user["id"]))
        return TokenResponse(access_token=access, refresh_token=new_refresh, user=user_dict)


@app.post("/auth/logout")
async def logout(req: RefreshRequest):
    await auth_svc.revoke_refresh_token(req.refresh_token)
    return {"message": "Logged out successfully"}


@app.get("/auth/users/{user_id}")
async def get_user(user_id: str):
    pool = await get_db()
    async with pool.acquire() as conn:
        # FIX: `name` not `full_name`; `last_login_at` not `last_login`
        user = await conn.fetchrow(
            "SELECT id, email, name, role, plan, company_id, created_at, last_login_at FROM users WHERE id = $1",
            UUID(user_id),
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {k: str(v) if isinstance(v, UUID) else v for k, v in dict(user).items()}


@app.post("/auth/api-keys", status_code=201)
async def create_api_key(req: CreateAPIKeyRequest):
    plain_key, hashed_key = auth_svc.generate_api_key()
    # key_prefix is first 16 chars of the plain key (safe to store for display)
    key_prefix = plain_key[:16]
    pool = await get_db()
    async with pool.acquire() as conn:
        key_id = uuid4()
        # FIX: DB schema has key_prefix, key_hash, no scopes column
        await conn.execute(
            """
            INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            key_id, UUID(req.user_id), req.name, key_prefix, hashed_key, datetime.utcnow(),
        )
    return {
        "key_id": str(key_id),
        "api_key": plain_key,  # Only returned once — user must copy it now
        "name": req.name,
        "scopes": req.scopes,
        "note": "Store this key securely. It will not be shown again.",
    }


@app.post("/auth/api-keys/validate")
async def validate_api_key(req: ValidateAPIKeyRequest):
    hashed_key = auth_svc.hash_api_key(req.api_key)
    pool = await get_db()
    async with pool.acquire() as conn:
        # Check if the API key exists and is active
        key = await conn.fetchrow(
            """
            SELECT id, user_id, plan, daily_limit, usage_today
            FROM api_keys
            WHERE key_hash = $1 AND is_active = TRUE
            """,
            hashed_key
        )
        if not key:
            raise HTTPException(status_code=401, detail="Invalid API key")

        # Update last used and usage count
        await conn.execute(
            """
            UPDATE api_keys
            SET last_used_at = NOW(), usage_today = usage_today + 1
            WHERE id = $1
            """,
            key["id"]
        )

        # Retrieve user info
        user = await conn.fetchrow(
            "SELECT id, email, name, role, plan, company_id FROM users WHERE id = $1 AND is_active = TRUE",
            key["user_id"]
        )
        if not user:
            raise HTTPException(status_code=401, detail="User account is deactivated")

        return {
            "user_id": str(user["id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "plan": user["plan"],
            "company_id": str(user["company_id"]) if user["company_id"] else None
        }


@app.get("/auth/api-keys")

async def list_api_keys(user_id: str):
    pool = await get_db()
    async with pool.acquire() as conn:
        # FIX: use last_used_at, is_active (not last_used, revoked)
        keys = await conn.fetch(
            "SELECT id, name, key_prefix, created_at, last_used_at FROM api_keys WHERE user_id = $1 AND is_active = TRUE",
            UUID(user_id),
        )
        return [{k: str(v) if hasattr(v, 'hex') else v for k, v in dict(row).items()} for row in keys]


@app.delete("/auth/api-keys/{key_id}")
async def revoke_api_key(key_id: str, user_id: str):
    pool = await get_db()
    async with pool.acquire() as conn:
        # FIX: use is_active = FALSE (not revoked = TRUE)
        result = await conn.execute(
            "UPDATE api_keys SET is_active = FALSE WHERE id = $1 AND user_id = $2",
            UUID(key_id), UUID(user_id),
        )
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key revoked"}


@app.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    pool = await get_db()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id FROM users WHERE email = $1", req.email)
        if user:
            token = await auth_svc.create_reset_token(str(user["id"]))
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
            # In production, send email here
            logger.info("Password reset requested", email=req.email, reset_url=reset_url)
    # Always return 200 to prevent email enumeration
    return {"message": "If this email is registered, you will receive a reset link shortly."}


@app.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    user_id = await auth_svc.verify_reset_token(req.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    pool = await get_db()
    async with pool.acquire() as conn:
        hashed = auth_svc.hash_password(req.new_password)
        await conn.execute(
            "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3",
            hashed, datetime.utcnow(), UUID(user_id),
        )

    await auth_svc.consume_reset_token(req.token)
    return {"message": "Password reset successfully"}


# ─── Enterprise SAML SSO ──────────────────────────────────────────────────────

@app.get("/auth/sso/login/{domain}")
async def sso_login(domain: str):
    pool = await get_db()
    async with pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id FROM tenants WHERE domain = $1", domain)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant organization not registered")

        sso_config = await conn.fetchrow(
            "SELECT sso_url, entity_id FROM tenant_sso_configs WHERE tenant_id = $1 AND is_active = TRUE",
            tenant["id"]
        )
        if not sso_config:
            raise HTTPException(status_code=400, detail="SSO authentication not configured for this tenant")

        relay_state = domain
        mock_saml_response = "PHNhbWxwOlJlc3BvbnNlIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wiPjwvc2FtbHA6UmVzcG9uc2U+"
        callback_redirect = f"{settings.FRONTEND_URL}/auth/sso/callback?SAMLResponse={mock_saml_response}&RelayState={relay_state}"

        logger.info("Redirecting to SAML IdP", sso_url=sso_config["sso_url"])
        return {"redirect_url": callback_redirect}


@app.post("/auth/sso/callback")
async def sso_callback(req: dict):
    relay_state = req.get("RelayState")
    saml_response = req.get("SAMLResponse")

    if not relay_state or not saml_response:
        raise HTTPException(status_code=400, detail="Missing SAML parameters")

    pool = await get_db()
    async with pool.acquire() as conn:
        tenant = await conn.fetchrow("SELECT id, display_name FROM tenants WHERE domain = $1", relay_state)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant organization not found")

        # In production: parse SAMLResponse and verify signature. Mock flow below:
        email = "enterprise-user@acme.com"
        name = "Enterprise User"   # FIX: was full_name

        user = await conn.fetchrow("SELECT id, email, role, plan, company_id FROM users WHERE email = $1", email)
        if not user:
            user_id = uuid4()
            # FIX: `name` not `full_name`
            user = await conn.fetchrow(
                """
                INSERT INTO users (id, email, name, role, plan, tenant_id, created_at, updated_at)
                VALUES ($1, $2, $3, 'viewer', 'enterprise', $4, NOW(), NOW())
                RETURNING id, email, name, role, plan, company_id, tenant_id
                """,
                user_id, email, name, tenant["id"]
            )
        else:
            await conn.execute("UPDATE users SET tenant_id = $1 WHERE id = $2", tenant["id"], user["id"])
            user = await conn.fetchrow(
                "SELECT id, email, name, role, plan, company_id, tenant_id FROM users WHERE id = $1",
                user["id"]
            )

        user_dict = {k: str(v) if isinstance(v, UUID) else v for k, v in dict(user).items()}
        access = auth_svc.create_access_token(user_dict)
        refresh = auth_svc.create_refresh_token(str(user["id"]))

        logger.info("SSO Login completed", email=email, tenant=relay_state)
        return TokenResponse(access_token=access, refresh_token=refresh, user=user_dict)
