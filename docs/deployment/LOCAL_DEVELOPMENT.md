# TenderOS v1.0.0 — Local Development Profile

This document outlines the **Local Development Profile** for TenderOS, designed specifically to run on resource-constrained development machines, such as Apple Silicon (M1/M2/M3) laptops with **8 GB RAM**.

---

## 1. Profile Overview

In contrast to the production architecture (which runs 23 services, heavy full-text search clusters, vector databases, graph databases, and message queues, requiring 32 GB RAM), the local development profile runs a **lean, optimized subset** of the platform.

### Resource Footprint Comparison

| Metric | Production Profile (`docker-compose.prod.yml`) | Local Dev Profile (`docker-compose.local.yml`) |
|---|---|---|
| **Active Containers** | 25+ | 10 |
| **Minimum Memory** | 32 GB RAM | **1.8 GB RAM** |
| **CPU Core Limits** | Shared | Strict Caps (0.25 - 1.0 CPU per container) |
| **Storage Overhead** | ~40 GB | **~3 GB** |

---

## 2. Startup Instructions

### Step 2a. Verify Pre-requisites
Make sure you have installed **Docker Desktop** (or `colima` + `docker` engine).

### Step 2b. Start the Local Profile
```bash
# Start lean database infrastructure and core microservices
docker compose -f docker-compose.local.yml up -d
```

### Step 2c. Verify Status
Wait approximately 30–60 seconds for the PostgreSQL database migrations to run automatically:
```bash
docker compose -f docker-compose.local.yml ps
```
All 10 services should report `Up (healthy)`.

### Step 2d. Inject Demo Seed Data
Run the seed script directly against the local PostgreSQL container:
```bash
docker exec -i tenderos-postgres-local psql -U tenderos -d tenderos \
  < infrastructure/postgres/seed_demo.sql
```

---

## 3. Core Workflow Verification

The local profile supports all critical procurement workflows through **graceful fallback mechanisms**:

### Feature Matrix

| Functional Area | Production Mode | Local Dev Mode | Fallback Strategy |
|---|---|---|---|
| **User Login** | JWT Session | ✅ Fully Enabled | Direct PostgreSQL verify |
| **Tender Search** | BM25 + Qdrant Vector | ✅ Fully Enabled | **PostgreSQL ILIKE Fallback** (auto-detects disabled OpenSearch/Qdrant and redirects query to PG database indexes) |
| **AI Copilot** | RAG via Qdrant | ✅ Fully Enabled | **Graceful Empty/Direct Fallback** (allows Q&A using direct metadata without crashing if Qdrant is disabled) |
| **Digital Twin** | GST/PAN Verification | ✅ Fully Enabled | Profile score computation & local upload mocks |
| **Bid Qualification** | Go/No-Go computation | ✅ Fully Enabled | Local criteria validation and regulatory scoring |
| **Proposal drafting** | Multi-agent proposals | ✅ Fully Enabled | Local text draft generator |
| **Workflow Engine** | 22-state machine | ✅ Fully Enabled | Postgres transaction state transitions |
| **Crawlers** | Auto-feed sync | ❌ Disabled | Mock connector / seed data only |
| **Object Storage** | MinIO | ❌ Disabled | Local file stubbing |
| **Graph DB** | Neo4j | ❌ Disabled | Falls back to database tables |
| **Message Queue** | RabbitMQ | ❌ Disabled | In-memory execution |
| **Monitoring** | Prometheus + Grafana | ❌ Disabled | Standard console log rotation |

---

## 4. Run Frontend Locally (Next.js)

To prevent Docker from compiling the frontend inside memory-limited environments, we recommend running the frontend on the host machine using Node.js:

```bash
cd apps/frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the platform.

---

## 5. Running Validation Scripts

Run the validation suite on your host terminal to ensure all API connections are active:

```bash
# 1. Run direct upgrade test checks
.venv/bin/python3 scripts/verify_upgrade.py

# 2. Run system integration check
.venv/bin/python3 scripts/integration_test.py
```

---

## 6. Shutdown Instructions

```bash
# Stop all containers and preserve database volumes
docker compose -f docker-compose.local.yml down

# Stop containers and delete all database volumes (fresh reset)
docker compose -f docker-compose.local.yml down -v
```
