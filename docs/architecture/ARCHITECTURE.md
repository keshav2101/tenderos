# TenderOS — Architecture
**Version**: 1.0 | **Updated**: July 5, 2026

## Overview

TenderOS is an event-driven microservices platform for AI-powered government procurement
intelligence in India. 22 Python (FastAPI) services sit behind a single API gateway. A Next.js
frontend communicates exclusively through the gateway.

## System Diagram

```
                          ┌──────────────────────────────────────────┐
                          │              NGINX / TLS                  │
                          │   tenderos.in     api.tenderos.in         │
                          └──────────┬──────────────┬────────────────┘
                                     │              │
                          ┌──────────▼───┐  ┌───────▼──────────────────┐
                          │  Frontend    │  │     API Gateway :8000     │
                          │  Next.js     │  │  JWT + Rate Limit + Proxy │
                          │  :3000       │  └──────────────┬────────────┘
                          └──────────────┘                 │
                                            ┌──────────────▼─────────────────┐
                                            │      Downstream Services        │
                          ┌─────────────────┼─────────────────────────────── ┤
                          │                 │                                 │
               ┌──────────▼──┐   ┌──────────▼──┐              ┌──────────────▼─┐
               │ Core Data    │   │  AI Layer    │              │ Business Logic  │
               │ auth :8001   │   │ search :8010 │              │ billing :8020   │
               │ tender :8002 │   │ copilot:8011 │              │ proposals:8017  │
               │ connector:   │   │ ai-ext :8007 │              │ notif :8018     │
               │  :8003       │   │ ocr   :8006  │              │ admin :8019     │
               │ scheduler:   │   │ doc-pipe:8005│              │ govern :8021    │
               │  :8004       │   │ class :8008  │              │ quality:8022    │
               └──────┬───────┘   └──────┬───────┘              └────────────────┘
                      │                  │
        ┌─────────────▼──────────────────▼──────────────────────┐
        │                   Intelligence Layer                    │
        │  bid-qual:8013  digital-twin:8012  market-intel:8014   │
        │  prediction:8015  competitor:8016  knowledge-graph:8009│
        └──────────────────────────┬─────────────────────────────┘
                                   │
        ┌──────────────────────────▼─────────────────────────────┐
        │                    Data Stores                          │
        │  PostgreSQL:5432   Redis:6379   OpenSearch:9200         │
        │  Qdrant:6333       MinIO:9000   RabbitMQ:5672           │
        │  Neo4j:7687 (declared, not yet used in code)            │
        └────────────────────────────────────────────────────────┘
```

## Service Responsibilities

| Service | Responsibility |
|---|---|
| api-gateway | Auth, rate limiting, routing, audit logging |
| auth-service | JWT, API keys, refresh tokens, SAML SSO, password reset |
| tender-service | Tender CRUD, watchlist, Redis queue consumer |
| connector-service | Portal crawlers (GeM/CPPP/Railways/PSU/State), normalization |
| scheduler-service | Cron-based connector trigger, sync_jobs tracking |
| document-pipeline | PDF download, state machine, chunking, embedding, Qdrant indexing |
| ocr-service | PDF classification, pdfplumber text, pytesseract OCR |
| ai-extraction | Tier1 rule-based + Tier3 LLM field extraction from tender text |
| classification-service | Category tagging from tender title/description |
| knowledge-graph | Entity relationship storage (PostgreSQL graph tables) |
| search-service | Hybrid BM25+semantic search, RRF fusion, Postgres fallback |
| copilot-service | Per-tender RAG Q&A with citations, multi-LLM support |
| digital-twin | Company profile CRUD, document upload, profile scoring |
| bid-qualification | Match scoring, eligibility checks, MSME/startup rules, gap analysis |
| market-intelligence | Analytics: trends, ministries, categories, states, overview |
| prediction-service | Upcoming tender forecasts (currently stub) |
| competitor-service | Competitor win rates from award history (currently stub) |
| proposal-service | Multi-agent bid proposal generation, workflow state machine |
| notification-service | Email/SMS/Slack/WhatsApp dispatch |
| admin-service | Admin dashboard: users, connectors, sync jobs, stats |
| billing-service | Stripe checkout, subscriptions, webhook handler |
| governance-service | AI model registry, decision audit trail, explainability |
| data-quality-service | Tender data quality checks, OCR confidence, dedup |

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js | 16.2.10 |
| Frontend | React | 19.2.4 |
| Frontend | TypeScript | 5.x |
| Frontend | TailwindCSS | 4.x |
| Backend | Python | 3.11+ |
| Backend | FastAPI | 0.111.0 |
| Backend | asyncpg | 0.29.0 |
| Backend | pydantic-settings | 2.3.0 |
| Backend | structlog | 24.2.0 |
| Search | OpenSearch | 2.14.0 |
| Vector DB | Qdrant | 1.9.0 |
| Database | PostgreSQL | 16 |
| Cache/Queue | Redis | 7 |
| Object Storage | MinIO | latest |
| Message Queue | RabbitMQ | 3.13 (declared, unused) |
| Graph DB | Neo4j | 5.20 (declared, unused in code) |
| OCR | Tesseract via pytesseract | — |
| OCR | pdfplumber | — |
| OCR | PyMuPDF (fitz) | — |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 | 3.0.1 |
| LLM | Gemini 2.0 Flash (primary) | — |
| LLM | OpenAI GPT-4o-mini (fallback) | — |
| LLM | Claude 3.5 Sonnet (fallback) | — |
| Auth | python-jose (JWT) | 3.3.0 |
| Auth | passlib bcrypt | — |
| Billing | Stripe | — |
| HTTP client | httpx | 0.27.0 |
| Deployment | Docker + Docker Compose | — |
| Deployment | Kubernetes + Helm | — |
| Reverse Proxy | NGINX | — |
| Metrics | Prometheus + Grafana | — |
