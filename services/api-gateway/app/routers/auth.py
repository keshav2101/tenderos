"""Auth router — proxies to auth-service."""
from fastapi import APIRouter, Request
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_proxy = ServiceProxy(settings.AUTH_SERVICE_URL)


@router.post("/register", summary="Register a new user")
async def register(request: Request):
    return await _proxy.post("/auth/register", json=await request.json())


@router.post("/login", summary="Login with email + password")
async def login(request: Request):
    return await _proxy.post("/auth/login", json=await request.json())


@router.post("/refresh", summary="Refresh access token")
async def refresh(request: Request):
    return await _proxy.post("/auth/refresh", json=await request.json())


@router.post("/logout", summary="Logout / revoke refresh token")
async def logout(request: Request):
    return await _proxy.post("/auth/logout", json=await request.json())


@router.get("/google", summary="Initiate Google OAuth")
async def google_oauth(request: Request):
    return await _proxy.get("/auth/google", params=dict(request.query_params))


@router.get("/google/callback", summary="Google OAuth callback")
async def google_callback(request: Request):
    return await _proxy.get("/auth/google/callback", params=dict(request.query_params))


@router.post("/forgot-password", summary="Request password reset email")
async def forgot_password(request: Request):
    return await _proxy.post("/auth/forgot-password", json=await request.json())


@router.post("/reset-password", summary="Reset password with token")
async def reset_password(request: Request):
    return await _proxy.post("/auth/reset-password", json=await request.json())


@router.get("/me", summary="Get current user profile")
async def get_me(request: Request):
    user = request.state.user
    return await _proxy.get(f"/auth/users/{user['user_id']}")


@router.post("/api-keys", summary="Create API key")
async def create_api_key(request: Request):
    user = request.state.user
    body = await request.json()
    body["user_id"] = user["user_id"]
    return await _proxy.post("/auth/api-keys", json=body)


@router.get("/api-keys", summary="List my API keys")
async def list_api_keys(request: Request):
    user = request.state.user
    return await _proxy.get("/auth/api-keys", params={"user_id": user["user_id"]})


@router.delete("/api-keys/{key_id}", summary="Revoke API key")
async def revoke_api_key(request: Request, key_id: str):
    user = request.state.user
    return await _proxy.delete(f"/auth/api-keys/{key_id}?user_id={user['user_id']}")
