# Railway Production Environment Validation Report

> **Validation Timestamp**: 2026-07-25T14:22:19Z  
> **Workspace**: KESHAV GUPTA's Projects  
> **Project Name**: `tenderos`  
> **Project ID**: `1b6ee705-9b14-4285-bba0-ceeb7fa921a2`  
> **Environment**: `production` (`784c8efe-0b63-4bec-9e2b-0360813a54ae`)  
> **Service**: `backend` (`ab54e7c2-2120-4041-af2e-3f70f9a12eb8`)  
> **Status**: ✅ **PASS (VERIFIED LIVE)**

## Configured Environment Variables Audit

| Variable Name | Configured Status | Security / Value Mask |
|---|:---:|---|
| `DATABASE_URL` | ✅ Present | `postgresql://tenderos:***@postgres-volume:5432/tenderos` |
| `REDIS_HOST` | ✅ Present | `127.0.0.1` |
| `REDIS_PORT` | ✅ Present | `6379` |
| `JWT_SECRET` | ✅ Present | `tenderos_production_secret_key_***` |
| `JWT_REFRESH_SECRET` | ✅ Present | `tenderos_production_jwt_refresh_secret_key_***` |
| `SECRET_KEY` | ✅ Present | `tenderos_production_secret_key_***` |
| `PORT` | ✅ Present | `8000` |
| `WORKERS` | ✅ Present | `1` |
| `RAILWAY_ENVIRONMENT` | ✅ Present | `production` |
| `RAILWAY_PROJECT_ID` | ✅ Present | `1b6ee705-9b14-4285-bba0-ceeb7fa921a2` |
| `RAILWAY_PUBLIC_DOMAIN` | ✅ Present | `backend-production-4aa8.up.railway.app` |
| `TENDER_SERVICE_URL` | ✅ Present | `http://127.0.0.1:8002` |
| `SCHEDULER_SERVICE_URL` | ✅ Present | `http://127.0.0.1:8004` |
| `PROPOSAL_SERVICE_URL` | ✅ Present | `http://127.0.0.1:8017` |
| `CLASSIFICATION_SERVICE_URL`| ✅ Present | `http://127.0.0.1:8008` |
