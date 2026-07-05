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

## Phase 3 — Current Work

See `task.md` → Phase 3 sections for full task breakdown.

Current focus:
1. `3.1` — Connector verification (GeM, CPPP, Railways, PSU, State)
2. `3.2` — Document pipeline end-to-end
3. `3.3` — Hybrid search production validation
4. `3.4` — Copilot RAG citation verification
