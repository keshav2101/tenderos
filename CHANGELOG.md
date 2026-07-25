# Changelog

All notable changes to TenderOS are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
TenderOS follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [1.0.0] — 2026-07-25

### Summary

TenderOS v1.0.0 General Availability — India's first AI-native government procurement intelligence platform.

**1,600+ live tenders tracked · 12 microservices · 205 portal connectors · Full AI copilot + RAG + proposal generation**

### Added

#### Core Platform
- Unified tender intelligence platform covering GeM, CPPP, IREPS, and 200+ Indian procurement portals
- Real-time tender discovery and lifecycle tracking across all 16 Indian procurement stages
- Multi-tenant architecture with JWT authentication and role-based access control (Admin, Analyst, Viewer)

#### AI Capabilities
- **AI Copilot** — RAG-powered conversational procurement advisor using Gemini 2.0 Flash
  - Hybrid BM25 + dense vector search (Qdrant) with Reciprocal Rank Fusion
  - Conversation memory with per-user session isolation
  - Evidence-backed responses with citation attribution
- **Proposal Generation Service** — End-to-end bid proposal generation
  - Technical narrative, compliance statements, commercial terms
  - EMD/PBG computation with MSME/Startup India exemptions
- **Compliance Engine** — GFR 2017, Make in India Order 2017, MSME Rules 2020
- **Risk Analysis Engine** — Multi-factor bid risk scoring with L1 probability estimation
- **Market Intelligence Service** — Competitor tracking, win rate analysis, market forecasting
- **Document Pipeline** — OCR, text chunking, SentenceTransformer vector indexing

#### Data & Intelligence
- Knowledge Graph Service (Neo4j) — supplier network with 6 relationship types
- Classification Service — NLP-powered tender classification and enrichment
- Data Quality Service — automated validation, deduplication, normalization
- Connector Service — 205 portal scrapers with rate limiting and retry logic

#### Infrastructure
- PostgreSQL 17 — primary data store with full ACID compliance
- Qdrant v1.13.6 — vector similarity search for RAG
- Redis 7.x — session cache, rate limiting, result caching
- MinIO — S3-compatible document storage
- OpenSearch 2.14 — full-text search across all tender content
- Neo4j 5.x — supplier knowledge graph
- RabbitMQ 3.13 — async job queue for crawl and document processing

#### Operations
- Prometheus + Grafana monitoring with per-service dashboards
- OpenTelemetry distributed tracing
- Structured JSON logging (structlog) across all services
- Health endpoints (`/health`, `/metrics`) on all 12 services
- Docker Compose full-stack deployment

#### Developer Experience
- Complete GitHub Actions CI/CD pipeline (lint → test → security → build → deploy)
- Pre-commit hooks (ruff, black, gitleaks)
- Dependabot automated dependency updates
- Playwright E2E test suite
- Infrastructure verification scripts with JSON evidence reports

#### Repository
- Professional README with architecture diagram, tech stack, and deployment guide
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
- GitHub issue templates (bug report, feature request)
- Pull request template
- .editorconfig for consistent formatting

### Indian Procurement Coverage

| Portal | Status |
|---|---|
| GeM (Government e-Marketplace) | ✅ Active |
| CPPP (Central Public Procurement Portal) | ✅ Active |
| IREPS (Indian Railways) | ✅ Active |
| Defence (DRDO, HAL, BEL) | ✅ Active |
| PSUs (ONGC, BHEL, NTPC, IOCL) | ✅ Active |
| State Portals (MH, KA, UP, and 20+ others) | ✅ Active |
| Municipal Corporations (AIIMS, IITs) | ✅ Active |

### Procurement Ontology Support

- EMD (Earnest Money Deposit) & exemptions (MSME/Udyam)
- Performance Bank Guarantee (PBG) computation
- BOQ (Bill of Quantities) parsing
- L1/QCBS evaluation
- MSME 15% purchase preference
- Startup India experience/turnover exemption
- Make in India Class-I/II supplier classification

### Known Limitations in v1.0.0

- Automated bid submission not yet supported (intelligence only)
- GeM API connector requires manual authentication token rotation
- OpenSearch may require ~5 minutes for first startup (JVM warmup)
- Docker Desktop for Mac with containerd snapshotter may require factory reset if I/O errors occur

---

## [0.9.0-RC1] — 2026-07-20

### Changed
- Production hardening: eliminated all mock data from prediction endpoints
- Replaced placeholder AI responses with Gemini-grounded generation
- Added evidence-based verification harnesses for all services
- Fixed Qdrant image tag (v1.9.0 → v1.13.6)
- Added healthcheck timeout fields to docker-compose.yml

---

## [0.8.0] — 2026-07-10

### Added
- Proposal service — full bid proposal generation pipeline
- Knowledge graph service — Neo4j supplier intelligence
- Market intelligence service — L1 prediction and win probability
- Phase 14: 205 real procurement portal scrapers (replaced all fixtures)

---

## [0.5.0] — 2026-07-01

### Added
- AI Copilot with RAG, conversation memory, and Gemini integration
- Document pipeline — OCR, chunking, Qdrant vector indexing
- Classification service — spaCy NLP enrichment
- Governance service — RBAC, audit trails, tenant isolation
- Billing service — usage quotas

---

## [0.2.0] — 2026-06-15

### Added
- Core tender service — CRUD, lifecycle tracking, 16-stage Indian procurement lifecycle
- Connector service — initial GeM and CPPP scrapers
- Scheduler service — APScheduler cron orchestration
- Frontend dashboard — Next.js 14 with search, tender details, procurement stages

---

## [0.1.0] — 2026-06-01

### Added
- Initial project structure
- PostgreSQL schema for Indian government procurement
- Basic FastAPI service template
- Docker Compose infrastructure setup

[Unreleased]: https://github.com/<your-org>/tenderos/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/<your-org>/tenderos/releases/tag/v1.0.0
[0.9.0-RC1]: https://github.com/<your-org>/tenderos/releases/tag/v0.9.0-rc1
[0.8.0]: https://github.com/<your-org>/tenderos/releases/tag/v0.8.0
[0.5.0]: https://github.com/<your-org>/tenderos/releases/tag/v0.5.0
[0.2.0]: https://github.com/<your-org>/tenderos/releases/tag/v0.2.0
[0.1.0]: https://github.com/<your-org>/tenderos/releases/tag/v0.1.0
