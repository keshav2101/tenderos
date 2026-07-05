# TenderOS — Task Tracker
**Current Phase**: Phase 2 — Critical Bug Fixes
**Last Updated**: July 5, 2026

---

## Phase 1 — Repository Audit ✅ COMPLETE

All audit findings documented in `implementation_plan.md`.

---

## Phase 2 — Critical Bug Fixes ✅ COMPLETE
**Completed**: 2026-07-05 | **Build**: ✓ Next.js TypeScript clean

| # | Task | File | Result |
|---|---|---|---|
| 2.1 | Add guest routes to PUBLIC_PATHS | `api-gateway/middleware/auth.py` | ✅ Fixed |
| 2.2 | Wire TenderCopilot to live API | `TenderCopilot.tsx` | ✅ Fixed |
| 2.3 | Fix tender detail href | `dashboard/page.tsx` | ✅ Fixed |
| 2.4 | Fix /auth/login → /login links | `app/page.tsx` (3 places) | ✅ Fixed |
| 2.5 | Add company_documents table | `init.sql` | ✅ Fixed |
| 2.6 | Add tender_documents pipeline cols | `init.sql` | ✅ Fixed |
| 2.7 | Remove runtime ALTER TABLE | `document-pipeline/main.py` | ✅ Fixed |
| 2.8 | Fix trigger ordering | `init.sql` | ✅ Fixed |
| 2.9 | Verify proposal-service imports | `agents.py`, `workflow.py` | ✅ Not a bug |
| 2.10 | Verify notification dispatcher | `dispatcher.py` | ✅ Not a bug |
| 2.11 | Guest watchlist 401 guard | `routers/tenders.py` | ✅ Fixed |
| 2.12 | Frontend build verification | `npm run build` | ✅ Passes |

| # | Task | File | Severity | Done |
|---|---|---|---|---|
| 2.1 | Add guest routes to PUBLIC_PATHS | `services/api-gateway/app/middleware/auth.py` | CRITICAL | ☐ |
| 2.2 | Wire TenderCopilot to live API | `apps/frontend/app/components/TenderCopilot.tsx` | CRITICAL | ☐ |
| 2.3 | Fix tender detail href | `apps/frontend/app/dashboard/page.tsx` | CRITICAL | ☐ |
| 2.4 | Add company_documents table | `infrastructure/postgres/init.sql` | CRITICAL | ☐ |
| 2.5 | Add tender_documents columns to init.sql | `infrastructure/postgres/init.sql` | HIGH | ☐ |
| 2.6 | Verify proposal-service agents.py + workflow.py | `services/proposal-service/app/` | HIGH | ☐ |
| 2.7 | Verify notification-service dispatcher.py | `services/notification-service/app/` | HIGH | ☐ |
| 2.8 | Add trigram indexes on ministry, department, ai_summary | `infrastructure/postgres/init.sql` | HIGH | ☐ |
| 2.9 | Provide valid GEMINI_API_KEY in .env | `.env` | HIGH | ☐ |
| 2.10 | Add .env to .gitignore, rotate all secrets | `.gitignore` | HIGH | ☐ |

**Verification**: `docker-compose -f docker-compose.local.yml up -d` → all services healthy
→ unauthenticated `GET /api/v1/tenders` returns 200 with real tenders
→ homepage search dropdown shows live results
→ Copilot answers with page citations

---

## Phase 3 — Production Hardening
**Status**: IN PROGRESS | **Started**: 2026-07-05

### 3.1 — Connector Verification
| # | Task | Done |
|---|---|---|
| 3.1.1 | Test GeM connector CSRF token flow against live portal | ☐ |
| 3.1.2 | Test CPPP RSS feed + HTML fallback | ☐ |
| 3.1.3 | Test Railways (IREPS) connector | ☐ |
| 3.1.4 | Test PSU connector | ☐ |
| 3.1.5 | Test State procurement connector | ☐ |
| 3.1.6 | Add connector normalization unit tests | ☐ |
| 3.1.7 | Verify Redis queue publish → consume round-trip | ☐ |
| 3.1.8 | Verify deduplication (same tender, different runs) | ☐ |
| 3.1.9 | Produce connector health report | ☐ |

### 3.2 — Document Pipeline Verification
| # | Task | Done |
|---|---|---|
| 3.2.1 | Verify PDF download + SHA256 checksum | ☐ |
| 3.2.2 | Verify OCR on text PDF (pdfplumber path) | ☐ |
| 3.2.3 | Verify OCR on scanned PDF (pytesseract path) | ☐ |
| 3.2.4 | Verify chunking produces correct page references | ☐ |
| 3.2.5 | Verify embeddings written to Qdrant tender_chunks | ☐ |
| 3.2.6 | Verify PostgreSQL fallback chunks for Copilot | ☐ |
| 3.2.7 | Verify document_status lifecycle QUEUED→READY | ☐ |
| 3.2.8 | Batch Qdrant upserts (100 chunks per call) | ☐ |

### 3.3 — Search Verification
| # | Task | Done |
|---|---|---|
| 3.3.1 | Verify OpenSearch index created with correct mappings | ☐ |
| 3.3.2 | Verify BM25 keyword search returns ranked results | ☐ |
| 3.3.3 | Verify Qdrant semantic search | ☐ |
| 3.3.4 | Verify hybrid RRF fusion | ☐ |
| 3.3.5 | Verify Postgres fallback when OS/Qdrant disabled | ☐ |
| 3.3.6 | Add GIN trigram indexes on ministry, department, ai_summary | ☐ |
| 3.3.7 | Add Redis result caching (5-min TTL) | ☐ |
| 3.3.8 | Replace fake /metrics with real Prometheus counters | ☐ |

### 3.4 — Copilot RAG Verification
| # | Task | Done |
|---|---|---|
| 3.4.1 | Verify Qdrant chunk retrieval filters by tender_id | ☐ |
| 3.4.2 | Verify citation page numbers match source chunks | ☐ |
| 3.4.3 | Verify local grounded fallback when LLM key absent | ☐ |
| 3.4.4 | Verify Gemini Flash call returns grounded answer | ☐ |
| 3.4.5 | Set valid GEMINI_API_KEY in .env | ☐ |

### 3.5 — Analytics Verification
| # | Task | Done |
|---|---|---|
| 3.5.1 | Verify /analytics/overview uses live DB counts | ☐ |
| 3.5.2 | Wire prediction service to real seasonality data | ☐ |
| 3.5.3 | Wire competitor service to award_records table | ☐ |
| 3.5.4 | Wire admin service to live PostgreSQL | ☐ |
| 3.5.5 | Wire governance service to DB persistence | ☐ |
| 3.5.6 | Wire data-quality service to live checks | ☐ |

### 3.6 — Security Hardening
| # | Task | Done |
|---|---|---|
| 3.6.1 | Rotate all secrets committed in .env | ☐ |
| 3.6.2 | Add .env to .gitignore | ☐ |
| 3.6.3 | Tighten CORS on internal services | ☐ |
| 3.6.4 | Block SAML mock in production config | ☐ |
| 3.6.5 | Remove unsafe-eval from CSP for production | ☐ |
| 3.6.6 | Add rate limiting on /auth/login (brute-force) | ☐ |

### 3.7 — Observability
| # | Task | Done |
|---|---|---|
| 3.7.1 | Instrument all services with prometheus-fastapi-instrumentator | ☐ |
| 3.7.2 | Configure Prometheus scrape targets | ☐ |
| 3.7.3 | Import Grafana dashboard JSON | ☐ |
| 3.7.4 | Add alerting rules: service down, error rate >1%, latency >500ms | ☐ |

### 3.8 — Frontend Completion
| # | Task | Done |
|---|---|---|
| 3.8.1 | Build /search advanced search page | ☐ |
| 3.8.2 | Build /profile company profile page | ☐ |
| 3.8.3 | Verify every page works without login (guest mode) | ☐ |
| 3.8.4 | Verify every page works with login | ☐ |

### 3.9 — Deployment
| # | Task | Done |
|---|---|---|
| 3.9.1 | Write GitHub Actions CI (lint → test → build → push) | ☐ |
| 3.9.2 | Write GitHub Actions CD (deploy on main merge) | ☐ |
| 3.9.3 | Update Kubernetes manifests for all 22 services | ☐ |
| 3.9.4 | Create Helm chart with values.yaml | ☐ |
| 3.9.5 | Configure TLS cert-manager | ☐ |
| 3.9.6 | Configure PostgreSQL automated backups | ☐ |

| # | Task | Done |
|---|---|---|
| 3.1 | Test and fix GeM connector CSRF flow | ☐ |
| 3.2 | Test and fix CPPP RSS feed parsing | ☐ |
| 3.3 | Verify Railways (IREPS) connector | ☐ |
| 3.4 | Verify PSU connector | ☐ |
| 3.5 | Verify State procurement connector | ☐ |
| 3.6 | Add /connectors/{id}/health endpoint | ☐ |
| 3.7 | End-to-end ingestion test with real GeM data | ☐ |

---

## Phase 4 — Document Intelligence
**Status**: NOT STARTED | **Est**: 3 days

| # | Task | Done |
|---|---|---|
| 4.1 | OCR service unit tests (text/scanned/mixed) | ☐ |
| 4.2 | Document pipeline state machine E2E test | ☐ |
| 4.3 | Verify Qdrant chunk storage and query | ☐ |
| 4.4 | Batch Qdrant upserts (fix PA-005) | ☐ |
| 4.5 | Add MinIO PDF storage | ☐ |

---

## Phase 5 — Hybrid Search
**Status**: NOT STARTED | **Est**: 2 days

| # | Task | Done |
|---|---|---|
| 5.1 | Add Redis result caching (5 min TTL) | ☐ |
| 5.2 | Real Prometheus metrics in search-service | ☐ |
| 5.3 | Verify OpenSearch index + ranking | ☐ |
| 5.4 | Verify Qdrant semantic ranking | ☐ |
| 5.5 | Live /search/facets from OpenSearch aggregations | ☐ |

---

## Phase 6 — AI Copilot
**Status**: NOT STARTED | **Est**: 2 days

| # | Task | Done |
|---|---|---|
| 6.1 | Live Copilot call in TenderCopilot.tsx | ☐ |
| 6.2 | Add conversation history (last 5 turns) | ☐ |
| 6.3 | SSE streaming responses | ☐ |
| 6.4 | Persist chat history for logged-in users | ☐ |

---

## Phase 7 — Analytics from Live Data
**Status**: NOT STARTED | **Est**: 2 days

| # | Task | Done |
|---|---|---|
| 7.1 | Prediction service — real seasonality from DB | ☐ |
| 7.2 | Competitor service — from award_records table | ☐ |
| 7.3 | Admin service — live PostgreSQL queries | ☐ |
| 7.4 | Governance service — persist to DB | ☐ |
| 7.5 | Data quality service — real checks | ☐ |

---

## Phase 8 — Recommendation Engine
**Status**: NOT STARTED | **Est**: 2 days

| # | Task | Done |
|---|---|---|
| 8.1 | Verify qualification scoring with real data | ☐ |
| 8.2 | Add bulk qualification endpoint | ☐ |
| 8.3 | Cache qualification scores in Redis | ☐ |
| 8.4 | Build company profile frontend page | ☐ |

---

## Phase 9 — Knowledge Graph
**Status**: NOT STARTED | **Est**: 2 days

| # | Task | Done |
|---|---|---|
| 9.1 | Ingest all tenders as graph nodes | ☐ |
| 9.2 | Ingest award history as edges | ☐ |
| 9.3 | Ministry tender network query endpoint | ☐ |

---

## Phase 10 — Enterprise Frontend
**Status**: NOT STARTED | **Est**: 3 days

| # | Task | Done |
|---|---|---|
| 10.1 | /search advanced search page | ☐ |
| 10.2 | /profile company profile page | ☐ |
| 10.3 | /pricing page | ☐ |
| 10.4 | /docs API documentation page | ☐ |
| 10.5 | Fix all broken href links | ☐ |
| 10.6 | Accessibility audit | ☐ |

---

## Phase 11 — Security
**Status**: NOT STARTED | **Est**: 2 days

---

## Phase 13 — Deployment & CI/CD
**Status**: NOT STARTED | **Est**: 3 days

| # | Task | Done |
|---|---|---|
| 13.1 | GitHub Actions CI pipeline | ☐ |
| 13.2 | GitHub Actions CD pipeline | ☐ |
| 13.3 | Update Kubernetes manifests | ☐ |
| 13.4 | Helm chart with values.yaml | ☐ |
| 13.5 | TLS cert automation | ☐ |
| 13.6 | PostgreSQL backup automation | ☐ |

---

## Known Bugs Log

| ID | Description | File | Severity |
|---|---|---|---|
| BUG-001 | Guest search returns 401 | api-gateway/middleware/auth.py | CRITICAL |
| BUG-002 | Copilot uses hardcoded DEMO_RESPONSES | TenderCopilot.tsx | CRITICAL |
| BUG-003 | Tender detail link is /tenders/{id} not /dashboard/tenders/{id} | dashboard/page.tsx | HIGH |
| BUG-004 | company_documents table missing from init.sql | init.sql | HIGH |
| BUG-005 | proposal-service will ImportError on start | proposal-service/app/main.py | HIGH |
| BUG-006 | notification-service will ImportError on start | notification-service/app/main.py | HIGH |
| BUG-007 | GEMINI_API_KEY format invalid | .env | HIGH |
| BUG-008 | Search /metrics returns fake hardcoded data | search-service/app/main.py | MEDIUM |
| BUG-009 | Prediction returns static mock list | prediction-service/app/main.py | MEDIUM |
| BUG-010 | Competitor returns fabricated data | competitor-service/app/main.py | MEDIUM |
| BUG-011 | Admin returns hardcoded mock data | admin-service/app/main.py | MEDIUM |
| BUG-012 | SAML SSO hardcodes enterprise-user@acme.com | auth-service/app/main.py | HIGH |
