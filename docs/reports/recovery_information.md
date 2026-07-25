# Phase 0 — Recovery Information

This document contains recovery configurations and rollback instructions for TenderOS v1.0.0.

---

## 📌 1. Git State

- **Baseline Tag**: `baseline-pre-hardening`
- **Active Branch**: `main`
- **Latest Commit**: `1a464a0`
- **Commit Message**: `chore: update apps/frontend submodule pointer to latest commit`

---

## 🗄️ 2. Database Backup & Schema

- **Schema Snapshot**: `/Users/keshavgupta/.gemini/antigravity-ide/brain/5179e53b-a517-42c0-b97c-9f019caff6c1/scratch/schema_snapshot.sql`
- **Raw Metadata Inventory**: `/Users/keshavgupta/.gemini/antigravity-ide/brain/5179e53b-a517-42c0-b97c-9f019caff6c1/scratch/db_metadata.json`

---

## 🐳 3. Local Container Recovery

The baseline docker container environment is defined by the following active profiles:
- Compose File: `docker-compose.local.yml`
- Network: `tenderos-local-net`
- Volumes:
  - `postgres_local_data`
  - `redis_local_data`

---

## 🔄 4. Rollback Instructions

### Step 1: Rollback Source Code to Baseline Tag
To revert all code files to the verified Phase 0 baseline state, run:
```bash
git checkout baseline-pre-hardening
git submodule update --init --recursive
```

### Step 2: Rebuild Local Container Environment
To purge active modifications and restore the container builds to the baseline tag:
```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml build --no-cache
docker-compose -f docker-compose.local.yml up -d
```

### Step 3: Restore Database Schema Snapshot
To reload the original baseline schema into the postgres database container:
```bash
docker exec -i tenderos-postgres-local psql -U tenderos -d tenderos < "/Users/keshavgupta/.gemini/antigravity-ide/brain/5179e53b-a517-42c0-b97c-9f019caff6c1/scratch/schema_snapshot.sql"
```
