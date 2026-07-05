"""Auth service — JWT management and user CRUD."""
from __future__ import annotations
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4

import structlog
from jose import jwt
from passlib.context import CryptContext
import redis.asyncio as aioredis

from app.config import settings

logger = structlog.get_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Core auth logic — password hashing, JWT generation, token management."""

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await aioredis.from_url(settings.redis_url, decode_responses=True)
        return self._redis

    # ─── Password ─────────────────────────────────────────────────────────────

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    # ─── JWT ──────────────────────────────────────────────────────────────────

    def create_access_token(self, user: dict) -> str:
        now = datetime.utcnow()
        expire = now + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
        payload = {
            "sub": str(user["id"]),
            "email": user["email"],
            "role": user.get("role", "viewer"),
            "plan": user.get("plan", "free"),
            "company_id": str(user.get("company_id", "")),
            "iat": now,
            "exp": expire,
            "type": "access",
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def create_refresh_token(self, user_id: str) -> str:
        now = datetime.utcnow()
        expire = now + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
        payload = {
            "sub": user_id,
            "iat": now,
            "exp": expire,
            "type": "refresh",
            "jti": str(uuid4()),  # Unique token ID for revocation
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            return None

    # ─── Refresh Token Revocation ─────────────────────────────────────────────

    async def revoke_refresh_token(self, token: str) -> None:
        """Blacklist a refresh token in Redis until expiry."""
        payload = self.decode_token(token)
        if not payload:
            return
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            ttl = max(0, int(exp - datetime.utcnow().timestamp()))
            redis = await self._get_redis()
            await redis.setex(f"revoked_token:{jti}", ttl, "1")

    async def is_token_revoked(self, jti: str) -> bool:
        redis = await self._get_redis()
        return bool(await redis.get(f"revoked_token:{jti}"))

    # ─── API Keys ─────────────────────────────────────────────────────────────

    def generate_api_key(self) -> tuple[str, str]:
        """
        Returns (plain_key, hashed_key).
        Only plain_key is shown to user once; hashed_key stored in DB.
        Format: tenderos_live_<32-char-random>
        """
        raw = secrets.token_urlsafe(32)
        plain = f"tenderos_live_{raw}"
        hashed = hashlib.sha256(plain.encode()).hexdigest()
        return plain, hashed

    def hash_api_key(self, plain: str) -> str:
        return hashlib.sha256(plain.encode()).hexdigest()

    # ─── Password Reset ───────────────────────────────────────────────────────

    async def create_reset_token(self, user_id: str) -> str:
        """Creates a short-lived (15 min) password reset token stored in Redis."""
        token = secrets.token_urlsafe(32)
        redis = await self._get_redis()
        await redis.setex(f"reset_token:{token}", 900, user_id)
        return token

    async def verify_reset_token(self, token: str) -> Optional[str]:
        """Returns user_id if token is valid, None if expired."""
        redis = await self._get_redis()
        user_id = await redis.get(f"reset_token:{token}")
        return user_id

    async def consume_reset_token(self, token: str) -> None:
        """Invalidate reset token after use."""
        redis = await self._get_redis()
        await redis.delete(f"reset_token:{token}")
