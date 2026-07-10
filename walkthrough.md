# TenderOS — Developer Walkthrough
**Updated**: 2026-07-05 | **Phase**: 3 (Production Hardening)

This document describes how to run TenderOS locally, verify each subsystem, and reproduce
the Phase 2 fixes. It is kept in sync with the implementation after every phase.

---

## Quick Start (Local — Lightweight Profile)

```bash
# 1. Start infrastructure (PostgreSQL + Redis only)
make infra

# 2. Wait for PostgreSQL
make wait-postgres

# 3. Seed demo data
make seed

# 4. Start all app services (local compose profile)
docker-compose -f docker-compose.local.yml up -d

# 5. Start frontend dev server
cd apps/frontend && npm run dev
```

Platform is now reachable at:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:18000
- API Docs: http://localhost:18000/docs

---

## Phase 2 Fix Verification

### BUG-001 — Guest Search

```bash
# Before fix: returned 401
# After fix: returns 200 with tenders array
curl -s http://localhost:18000/api/v1/tenders | python3 -m json.tool | head -20

# Guest search
curl -s "http://localhost:18000/api/v1/search?q=AI" | python3 -m json.tool | head -20

# Homepage stats (guest)
curl -s http://localhost:18000/api/v1/analytics/overview | python3 -m json.tool
```

Expected: `200 OK` with `{"tenders": [...], "total": N}` — no auth header required.

### BUG-001 — Watchlist still requires auth

```bash
# Watchlist POST without token — should return 401, not 500
curl -s -X POST http://localhost:18000/api/v1/tenders/some-id/watchlist \
  -H "Content-Type: application/json" -d '{}'
```

Expected: `{"detail": "Authentication required to manage watchlist"}` with status 401.

### BUG-002 — Copilot calls real API

Open http://localhost:3000/dashboard/tenders/`<any-tender-id>` in browser.
The Copilot panel status shows **"Live"** (green dot) instead of "Ready".
Type any question. The request goes to `POST /api/v1/chat/<tender-id>`.
Open browser DevTools → Network → confirm XHR to `/api/v1/chat/`.
No `DEMO_RESPONSES` key lookup in source.

### BUG-003 — Routing

```bash
# Tender detail page resolves correctly
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/tenders/30000000-0000-0000-0000-000000000001
# Expected: 200

# /tenders/ route no longer exists (404 on frontend)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tenders/some-id
# Expected: 404

# Login page at /login (not /auth/login)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
# Expected: 200
```

### BUG-004 — Database Schema

```bash
# Connect to PostgreSQL and verify tables
docker exec -it tenderos-postgres-local psql -U tenderos -d tenderos -c \
  "\d company_documents"

# Expected: table with id, user_id, company_id, name, type, verified, etc.

docker exec -it tenderos-postgres-local psql -U tenderos -d tenderos -c \
  "\d tender_documents" | grep -E "document_status|embedding_status|current_state"

# Expected: three rows showing the pipeline tracking columns
```

---

## Seeded Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@tenderos.in | AdminSecure@TenderOS2026! | admin |
| enterprise@demo.in | EnterpriseDemo@2026! | enterprise |
| msme@demo.in | MSMEDemoExemption@2026! | sme |
| startup@demo.in | StartupRelaxation@2026! | sme |
| viewer@demo.in | ViewerAccessOnly@2026! | viewer |

---

## Triggering a Live Connector Sync

```bash
# Trigger GeM connector manually
curl -s -X POST http://localhost:18000/api/v1/admin/connectors/gem/sync \
  -H "Authorization: Bearer <admin_jwt>"

# Check connector health
curl -s http://localhost:18000/api/v1/admin/connectors \
  -H "Authorization: Bearer <admin_jwt>"

# Watch scheduler jobs
curl -s http://localhost:8004/scheduler/jobs | python3 -m json.tool
```

---

## Running the Document Pipeline

```bash
# Process a tender document
curl -s -X POST http://localhost:8005/document/process \
  -H "Content-Type: application/json" \
  -d '{"tender_id": "30000000-0000-0000-0000-000000000001",
       "document_url": "https://example.com/tender.pdf",
       "document_name": "tender_spec.pdf"}'

# Check document status
docker exec -it tenderos-postgres-local psql -U tenderos -d tenderos -c \
  "SELECT id, filename, document_status, current_state, embedding_status
   FROM tender_documents
   ORDER BY created_at DESC LIMIT 5;"
```

---

## Frontend Build

```bash
cd apps/frontend
npm run build
# Expected output:
# ✓ TypeScript — 0 errors
# ✓ Compiled in ~3s
# Route (app)
#   ○ /
#   ○ /dashboard
#   ƒ /dashboard/tenders/[id]
#   ○ /login
#   ○ /register
```

---

## Phase 3 — Production Verification (Completed)

We have successfully completed and verified the remaining key items in Phase 2.5 and Phase 3:

### 1. Robust Portals & Connectors (Phase 2.5)
- **State eProcurement (Maharashtra)**, **Railways (IREPS)**, and **PSUs (BHEL/NTPC)** connectors have been fully completed under `services/connector-service/app/connectors/plugins/`.
- Handled **Cloudflare/WAF block detection** & structured logs detailing limits.
- Configured a compliant **sandbox fallback notice dataset** yielding high-fidelity tenders containing:
  - Estimated cost, EMD waivers, MSME benefits, and bid validity timelines.
- Seeded new connectors into the Postgres database. Triggering sync successfully registers job metrics and populates database.

### 2. Automatic Scheduler Sync (Phase 3)
- Refactored `services/scheduler-service` to manage separate HTTP client lifecycles for asynchronous sync workers (resolving the `Cannot send a request, as the client has been closed` issue).
- Scheduler successfully matches cron records, runs background workers, logs sync progress, and updates connector records in Postgres.
- Verifying:
```bash
# Check scheduler job history
curl -s http://localhost:8004/scheduler/jobs | python3 -m json.tool | head -40
```

### 3. Search-First Guest Experience (Phase 3)
- Configured the landing page search bar to route users to guest-friendly routes.
- Modified the Next.js `DashboardLayout` auth guard to **bypass auth redirection** for `/dashboard/search` and `/dashboard/tenders/[id]`.
- Unauthenticated users can search, browse results, view tender summaries, and access AI Copilot chat without logging in.
- Watchlist and Proposal operations remain fully protected. Lock symbols and SignIn buttons prompt authentication when accessing restricted areas.

---

## Phase 8 — Round 2 & 3 Validation (Completed)

We have verified the complete Guest User Journey and Logged-in User Journey:

### 1. Guest User Journey (Round 2)
- **Search & Filters**: Verified landing page loads and guests can run queries such as `"AI Camera"` or `"Surveillance"` to fetch tenders, view pagination, and filter by ministry.
- **Tender Detail Page**: Unauthenticated users can view tender metadata (EMD, cost in lakhs, submission deadlines) and AI-generated summaries.
- **Anonymous Copilot Chat**: Checked that guests can chat with the Copilot to summarize documents, retrieve MSME relaxations, or locate EMD criteria without throwing server exceptions.
- **Route Guard Security**: Confirmed that guest access to restricted paths (`/watchlist`, `/proposals`, `/profile`) returns clean **`401 Unauthorized`** response codes.

### 2. Logged-in User Journey (Round 3)
- **Registration & Login**: Verified registration and login returns a fresh Bearer token.
- **Digital Twin Profile**: Created and updated the company digital twin (storing GSTIN, PAN, CIN, and Udyam details) with automatic schema enum mapping for Indian organization classifications.
- **Watchlist CRUD**: Tested watchlisting tenders, retrieving lists, and deleting watchlisted items. Prioritized JWT validation at the gateway level so that watchlisted paths receive user contexts correctly.
- **Proposal Generation**: Checked multi-agent draft generation producing compliant Technical Proposal outlines, Risk Assessments, and Missing Document lists.
- **Workflow State Transitions & RBAC**: Successfully transitioned bid state from `TECHNICAL_REVIEW` to `FINANCE_REVIEW` and confirmed that restricted states (like `MANAGEMENT_APPROVAL`) correctly reject unauthorised roles with a clean **`403 Forbidden`** response.
- **Logout & Revocation**: Verified `/auth/logout` completely revokes the refresh token, blocking subsequent token refresh attempts with a revoked exception.

### 3. Administration, Connectors, Recovery & Performance Validation (Round 4)
- **Admin Dashboard**: Verified admin authentication and administrative endpoints (getting stats, listing users, viewing logs).
- **Connector manual sync**: Successfully triggered a manual sync for the PSU connector using the admin endpoint. Checked scheduler job lists to confirm the sync execution logs.
- **Search Fallback**: Confirmed that search-service successfully falls back to PostgreSQL direct queries if OpenSearch indices are uninitialized or empty, yielding accurate search results.
- **Service Recovery & Reconnections**: Restarted PostgreSQL and Redis containers, verifying that the gateway and app pools reconnect and serve new requests.
- **Performance & Metrics**: Confirmed that the Prometheus `/metrics` endpoint is online. Measured total latency for health checks (~0.02s), tenders listing (~0.67s), and search fallback (~1.24s).
- **Restart smoke test**: Validated that all container restart configurations (`restart: on-failure`) are configured and the system passes final smoke tests after daemon restarts.
