# TenderOS — AI Procurement Intelligence Platform
> **B.Tech Major Project Submission (College Release v1.0.0)**

TenderOS is an enterprise-grade, AI-powered Government Procurement Operating System designed for the Indian Public Procurement Ecosystem. It automates aggregation, deep layout document intelligence, and qualification scoring for tenders published on the Government e-Marketplace (GeM), Central Public Procurement Portal (CPPP), Indian Railways (IREPS), PSUs, and state procurement portals.

---

## 🚀 Live Production Details
- **Production API Gateway**: [https://backend-production-4aa8.up.railway.app](https://backend-production-4aa8.up.railway.app)
- **Hosted Environment**: Railway (SFO Region)

---

## 🛠️ Complete Project Documentation Index

To explore the architecture, installation, or validation evidence of TenderOS, reference the corresponding project manuals below:

### 1. Verification & Compliance
- 📂 **[Production Validation Report](production_validation_report.md)**: Live verification status of routing, databases, and HSTS/CSP headers.
- 📂 **[Final Delivery Report](FINAL_DELIVERY_REPORT.md)**: GA release certification and Git metrics overview.
- 📂 **[Testing Report](TEST_REPORT.md)**: E2E and regression testing matrices for auth, gateway, and backend services.
- 📂 **[Performance Report](PERFORMANCE_REPORT.md)**: Latency profile curves (P50, P95, P99) and container RAM footprints.

### 2. Design & Architecture
- 📂 **[System Architecture](ARCHITECTURE.md)**: Detailed Mermaid UML topologies, data flow routes, and API Gateway sequences.
- 📂 **[Database Documentation](DATABASE_DOCUMENTATION.md)**: ER diagrams, constraints, trigram indexes, and schema tables.
- 📂 **[Security Policy](SECURITY.md)**: Details JWT session TTL, RBAC roles matrix, and transit encryption rules.
- 📂 **[Project Metrics](PROJECT_METRICS.md)**: Lines of code, container topologies, and component statistics.

### 3. Operations & Setup Manuals
- 📂 **[API Reference Documentation](API_DOCUMENTATION.md)**: Route specs, parameter details, and JSON request/response schema samples.
- 📂 **[User Operations Manual](USER_MANUAL.md)**: User guide for dashboard controls, search, and AI bid generation.
- 📂 **[Administrator Operations Manual](ADMIN_MANUAL.md)**: DevOps workflows for database snapshots, monitoring, and service restarts.
- 📂 **[Installation Manual](INSTALLATION.md)**: Setting up local python environments, Docker Compose, and cloud instances.
- 📂 **[Deployment Playbook](DEPLOYMENT.md)**: Railway environment keys and rollback sequences.

### 4. B.Tech Academic Deliverables
- 📂 **[Major Project Report](PROJECT_REPORT.md)**: The final B.Tech Project thesis report (Abstract, survey, algorithms, and methodologies).
- 📂 **[Presentation Slide Deck Content](PRESENTATION_CONTENT.md)**: Slide-by-slide project deck layout for the major viva defense.
- 📂 **[Viva Defense Preparation Guide](VIVA_GUIDE.md)**: 50+ viva defense questions covering database, AI/RAG, and microservices.
- 📂 **[Resume Project Highlights](RESUME_PROJECT_DESCRIPTION.md)**: Portfolio-grade resume summary points.
- 📂 **[Release Notes](RELEASE_NOTES.md)** & **[Changelog](CHANGELOG.md)**: Version release notes for v1.0.0.

---

## 🏢 Platform System Architecture

```
52+ Indian Ministries · 200+ Depts · GeM · CPPP · Railways
                    │
                    ▼
      Connector Service (Scrapers & Normalizers)
                    │
      Redis Ingestion Queue (tenderos:ingestion_queue)
                    │
                    ▼
     OCR & Layout Intelligence (ocr-service)
                    │
                    ▼
          Core Microservices Ecosystem
     [auth] · [tender] · [search] · [copilot] · [proposal]
                    │
                    ▼
  PostgreSQL 16 · Redis Cache · Qdrant Vector DB
                    │
                    ▼
          Uvicorn API Gateway (Port 8080)
                    │
                    ▼
       Next.js 14 Responsive UI
```

---

## ⚡ Technology Stack

* **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
* **API Gateway & Services**: FastAPI (Uvicorn), Python 3.11
* **Primary Relational DB**: PostgreSQL 16
* **In-Memory Cache**: Redis 7
* **Search Engine**: OpenSearch (Hybrid BM25) / PG Trigram Fallback
* **Vector Vector Store**: Qdrant Semantic Vector Index
* **Graph Database**: Neo4j (Ministry relationship network mapping)
* **LLM Engine**: Gemini 2.0 Flash (Default RAG)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
