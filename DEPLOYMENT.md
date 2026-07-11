# Production Deployment Guide — TenderOS v1.0.0

This guide details the configurations, deployment workflows, environment mappings, backup processes, and recovery sequences for the production deployment of TenderOS.

---

## 1. Production Topology & Environment

The TenderOS production environment is hosted entirely on the **Railway** platform under a **Hobby Tier** plan, utilizing isolated container services and managed persistence:

- **Deployment URL**: [https://backend-production-4aa8.up.railway.app](https://backend-production-4aa8.up.railway.app)
- **Region**: `sfo` (US West / San Francisco)
- **Execution Target**: Single consolidated Docker deployment running multiple staggered backend services (auth, tender, connector, etc.) behind a unified API gateway.

---

## 2. Environment Variables Specification

The following variables must be configured on the `backend` service card in your Railway project panel:

| Name | Example Value | Description |
|---|---|---|
| **DATABASE_URL** | `${{Postgres.DATABASE_URL}}` | Auto-interpolated PostgreSQL connection string. |
| **SECRET_KEY** | `tenderos_production_secret_key_2026` | Cryptographic signature key for Auth service. |
| **JWT_SECRET** | `tenderos_production_secret_key_2026` | Token generation key. |
| **JWT_REFRESH_SECRET** | `tenderos_production_jwt_refresh_secret_key_2026` | Session refresh token validation key. |
| **CORS_ORIGINS** | `["*"]` | Allowed CORS source origins array. |
| **ENVIRONMENT** | `production` | Switches services into production mode. |
| **DEBUG** | `false` | Disables debug logs and traceback exposure. |
| **WORKERS** | `1` | Number of worker processes per service. |
| **REDIS_HOST** | `127.0.0.1` | Local inside-container Redis service host. |
| **REDIS_PORT** | `6379` | Port for local Redis container service. |
| **GEMINI_API_KEY** | `AIzaSy...` | API Key for LLM grounding (Tender Copilot RAG). |
| **ANTHROPIC_API_KEY** | `sk-ant-...` | API Key for alternative Claude RAG models. |

---

## 3. Deployment & CI/CD Pipeline

To trigger a new build and rolling update:

1. Stage and commit your changes:
   ```bash
   git add .
   git commit -m "Update v1.0.0"
   ```
2. Deploy directly from the command line:
   ```bash
   railway up
   ```
   *Note: Using `railway up --detach` uploads project assets and starts the build asynchronously without blocking the terminal.*

---

## 4. Rollback & Recovery Actions

### 4.1 Quick Deployment Rollback
If a new release build causes service regressions or fails live checks:

1. Identify the previous successful deployment ID:
   ```bash
   railway deployment list
   ```
2. Rollback/redeploy that specific deployment:
   ```bash
   railway deployment redeploy <deployment_id>
   ```

### 4.2 Database Restore Workflow
To restore the PostgreSQL database state from a snapshot:

1. Log in to the Railway console.
2. Select the **Postgres** service card.
3. Open the **Backups** tab.
4. Locate the desired historical snapshot.
5. Click **Restore**.

---

## 5. Pre-Release Checklist (Production Go-Live)

Prior to marking a release as General Availability (GA):

- [x] Run `python3 scripts/verify_production_readiness.py` to assert API Gateway responses.
- [x] Assert that security headers (HSTS, CSP, X-Frame-Options) exist on the `/health` payload.
- [x] Verify database pool connects to Postgres internally via the private network (`postgres.railway.internal`).
- [x] Audit Docker builds to confirm no development keys or passwords are baked into images.
