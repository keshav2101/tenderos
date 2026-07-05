"""Admin router — requires admin role."""
from fastapi import APIRouter, Request, HTTPException, status
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_proxy = ServiceProxy(settings.ADMIN_SERVICE_URL)
_connector_proxy = ServiceProxy(settings.CONNECTOR_SERVICE_URL)
_scheduler_proxy = ServiceProxy(settings.SCHEDULER_SERVICE_URL)


def require_admin(request: Request):
    user = getattr(request.state, "user", None)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.get("/connectors", summary="List all connectors and their health")
async def list_connectors(request: Request):
    require_admin(request)
    return await _connector_proxy.get("/connectors")


@router.post("/connectors/{source_id}/sync", summary="Trigger manual sync for a connector")
async def trigger_sync(request: Request, source_id: str):
    require_admin(request)
    return await _connector_proxy.post(f"/connectors/{source_id}/sync")


@router.get("/sync-jobs", summary="List recent sync jobs")
async def list_sync_jobs(request: Request):
    require_admin(request)
    params = dict(request.query_params)
    return await _scheduler_proxy.get("/scheduler/jobs", params=params)


@router.get("/sync-jobs/{job_id}/logs", summary="Get sync job logs")
async def get_sync_job_logs(request: Request, job_id: str):
    require_admin(request)
    return await _scheduler_proxy.get(f"/scheduler/jobs/{job_id}/logs")



@router.get("/users", summary="List all users")
async def list_users(request: Request):
    require_admin(request)
    params = dict(request.query_params)
    return await _proxy.get("/users", params=params)


@router.put("/users/{user_id}/role", summary="Update user role")
async def update_user_role(request: Request, user_id: str):
    require_admin(request)
    return await _proxy.put(f"/users/{user_id}/role", json=await request.json())


@router.get("/stats", summary="Platform-wide statistics")
async def get_stats(request: Request):
    require_admin(request)
    return await _proxy.get("/stats")


@router.get("/logs", summary="Recent audit logs")
async def get_logs(request: Request):
    require_admin(request)
    params = dict(request.query_params)
    return await _proxy.get("/logs", params=params)
