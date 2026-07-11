# Project Metrics — TenderOS v1.0.0

This document compiles the code statistics, architecture breakdown, and component counts of the TenderOS platform.

---

## 1. Lines of Code (LOC) Summary

The codebase has been analyzed across active Python backend and TypeScript frontend components (excluding third-party dependencies, virtual environments, and compiler caches):

- **Backend (Python)**: `12,035` LOC
- **Frontend (TypeScript/TSX)**: `3,153` LOC
- **Total Lines of Code**: **`15,188` LOC**
- **Number of Active Code Files**: 104

---

## 2. Microservice Component Counts

TenderOS is built on a highly modular distributed service ecosystem:

- **Total Microservices**: **22** Python FastAPI microservices
- **API Gateway Routers**: **20** distinct route endpoints (under `/services/api-gateway/app/routers/` handling auth, billing, proposals, tenders, etc.)
- **Staggered Launch Footprint**: Configured to run inside a single memory-constrained Docker container group using a dynamic `start.sh` startup script.

---

## 3. Database Schema Metrics (PostgreSQL)

The primary database schema is managed via PostgreSQL 16:

- **Total Database Tables**: **33** tables (defined in `infrastructure/postgres/init.sql`)
- **Index Schemes**: 15 indices, including:
  - B-Tree relational key indexes.
  - GIN indexes for category lists.
  - Trigram indices (`pg_trgm` extension) supporting fast fuzzy searching on ministries and departments.
- **Relational Integrity**: Enforced via foreign key constraints with `ON DELETE CASCADE` triggers for session tokens and watchlists.

---

## 4. Third-Party Dependency Analysis

- **Backend Packages**: 45 packages pinned in `requirements.txt` (including `asyncpg` database drivers, `fastapi` routing, `pydantic-settings`, and `email-validator`).
- **Frontend Packages**: 18 direct development dependencies in Next.js `package.json` (TailwindCSS, React, ESLint).
