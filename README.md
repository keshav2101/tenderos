# TenderOS — AI Procurement Intelligence Platform

> **Not another tender website. An AI operating system for procurement.**

Read every government tender in India. Understand it. Predict it. Help businesses win it.

---

## Architecture

```
52+ Ministries · 200+ Departments · 30+ State Portals · GeM · CPPP · Railways

                    │
                    ▼
      Distributed Intelligent Crawlers (Connector Service)
                    │
      Change Detection + Scheduler + RabbitMQ Queue
                    │
                    ▼
         OCR + Layout Understanding (OCR Service)
         pdfplumber (text) · pytesseract (scanned) · PyMuPDF
                    │
                    ▼
         3-Tier AI Information Extraction
         Tier 1: Rule-based / regex / spaCy (~70% of fields)
         Tier 2: Small open-weights model (complex layouts)
         Tier 3: Gemini 2.0 Flash (hard cases, 7-day cache)
                    │
                    ▼
      ┌─────────────────────────────────────────────────┐
      │          Core Data Stores                        │
      │  PostgreSQL  ·  Qdrant  ·  OpenSearch  ·  Neo4j │
      └─────────────────────────────────────────────────┘
                    │
                    ▼
         Intelligence Layers 5–11
         └─ Search (BM25 + Semantic + RRF)
         └─ Copilot RAG (cited Q&A)
         └─ Digital Twin (company profile)
         └─ Bid Qualification Engine
         └─ Market Intelligence
         └─ Predictive Procurement
         └─ Competitor Intelligence
         └─ Proposal Generator
         └─ Notification Engine
                    │
                    ▼
         API Gateway (FastAPI) → Next.js 14 Frontend
```

---

## 11 Intelligence Layers

| Layer | Component | Description |
|-------|-----------|-------------|
| 1 | Connector Service | GeM, CPPP, state portals via official APIs |
| 2 | OCR Service | PDF intelligence (text/scanned/mixed auto-detect) |
| 3 | AI Extraction | 3-tier pipeline with Redis caching |
| 4 | Knowledge Graph | Neo4j: Ministries → Depts → Vendors → Tenders |
| 5 | Hybrid Search | BM25 + Semantic + RRF < 300ms |
| 6 | Tender Copilot | RAG with page-level citations |
| 7 | Digital Twin | AI-parsed company profile |
| 8 | Bid Qualification | Match score, gap analysis, win probability |
| 9 | Market Intelligence | Spending trends, seasonality, ministry analytics |
| 10 | Predictive Procurement | Probabilistic forecasts by ministry/category |
| 11 | Competitor Intelligence | Historical win rates from public procurement records |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| API Gateway | FastAPI, Python 3.11 |
| Microservices | FastAPI (17 services) |
| Primary DB | PostgreSQL 16 (pg_trgm, btree_gin) |
| Vector DB | Qdrant |
| Search | OpenSearch (BM25) |
| Graph DB | Neo4j |
| Object Storage | MinIO (S3-compatible) |
| Cache | Redis 7 |
| Message Queue | RabbitMQ |
| LLM | Gemini 2.0 Flash (default), OpenAI GPT-4o-mini, Claude 3.5 Sonnet |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| OCR | pytesseract + PyMuPDF (300 DPI) |
| Container | Docker + Docker Compose |

---

## Quick Start

### Prerequisites
- Docker 24+ and Docker Compose 2.20+
- Python 3.11+
- Node.js 18+

### 1. Start Infrastructure

```bash
make infra
```

This starts: PostgreSQL, Redis, RabbitMQ, Qdrant, OpenSearch, MinIO, Neo4j.

### 2. Seed Data

```bash
make seed
```

Generates 500 realistic synthetic tenders and indexes them into:
- PostgreSQL (structured data)
- OpenSearch (BM25 full-text index)
- Qdrant (semantic vector index)

### 3. Start Frontend

```bash
make dev-frontend
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Start All Services

```bash
make up
```

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health/deep

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for AI extraction (at least one)
GEMINI_API_KEY=your-key
OPENAI_API_KEY=your-key          # Optional fallback
ANTHROPIC_API_KEY=your-key       # Optional fallback

# Database (defaults work for local Docker)
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=tenderos_dev_password

# Infrastructure (defaults for local Docker)
REDIS_HOST=localhost
QDRANT_HOST=localhost
OPENSEARCH_HOST=localhost

# JWT
JWT_SECRET=change-this-in-production
```

---

## Service Directory

```
services/
├── api-gateway/          # Routing, auth middleware, rate limiting
├── auth-service/         # JWT, OAuth, API keys, password reset
├── tender-service/       # Tender CRUD, watchlist, similar tenders
├── connector-service/    # Data source connectors (GeM, CPPP, etc.)
├── scheduler-service/    # Cron-based sync scheduler
├── ocr-service/          # PDF extraction (text + scanned)
├── document-pipeline/    # Document orchestration queue consumer
├── ai-extraction/        # 3-tier extraction pipeline
├── search-service/       # Hybrid BM25 + semantic search
├── copilot-service/      # RAG chat with document citations
├── digital-twin-service/ # Company profile and document AI
├── bid-qualification/    # Eligibility scoring and gap analysis
├── market-intelligence/  # Spending analytics and trends
├── prediction-service/   # Probabilistic tender forecasting
├── competitor-service/   # Competitor win rate analysis
├── proposal-service/     # AI proposal draft generation
├── notification-service/ # Deadline alerts and feed updates
└── admin-service/        # Platform ops, sync management
```

---

## Monetization Tiers

| Tier | Price | Rate Limit | Features |
|------|-------|------------|---------|
| Free | ₹0 | 10 req/min | 20 tenders/day, basic search |
| SME | ₹2,999/mo | 200 req/min | Full access, Copilot, Digital Twin |
| Enterprise | ₹14,999/mo | 2,000 req/min | All features + API access |
| API | Custom | 10,000 req/min | API-only, full data access |

---

## Ethical Guidelines

- **Official APIs only**: Connectors use published government APIs (GeM, CPPP)
- **Rate limiting**: All crawlers respect portal rate limits
- **No auth bypass**: No login bypass or CAPTCHA solving
- **Public data only**: Only publicly available procurement data
- **Competitor intelligence**: Based solely on public procurement award records
- **Forecasts labeled**: All predictions are labeled as probabilistic estimates

---

## License

MIT — See [LICENSE](LICENSE)
