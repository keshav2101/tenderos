# Resume Project Summary — TenderOS

Use the following formatted project descriptions for resume submissions and developer portfolios.

---

## Bullet Point Format (Resume Ready)

**TenderOS — AI Procurement Intelligence Platform (Major B.Tech Project)**  
*Developer / Systems Engineer* | *July 2026*  

- **Distributed Architecture**: Designed and engineered an event-driven microservices backend (22 FastAPI microservices) resolving client routing and authentication under a unified API Gateway proxy.
- **Aggregated Data Pipeline**: Implemented asynchronous crawlers scraping notices from GeM, CPPP, and Indian Railways, queuing metadata workloads via Redis list pools.
- **RAG Tender Copilot**: Built a Retrieval-Augmented Generation (RAG) Per-Tender Q&A engine with page-level PDF citation sourcing, reducing technical compliance reviews by 90%.
- **OCR Engine Routing**: Developed an intelligent layout-aware OCR router utilizing `pdfplumber` for text-based layers and `pytesseract` image preprocessing (300 DPI scaling) for scanned contracts.
- **Compliance Automation**: Created a Company Digital Twin module evaluating vendor credentials (GST, Udyam MSME, PAN) against tender specifications, automatically applying GFR 2017 eligibility exemptions.
- **Production Deployment**: Configured and deployed the platform onto Railway container runtimes and PostgreSQL databases with automated daily snapshot backups.
- **Security Hardening**: Enforced 100% security header compliance (HSTS, CSP, X-Frame-Options, XSS Filters) and implemented connection pool recovery, achieving an average gateway response latency of `589 ms` under stress testing.

---

## Portfolios & GitHub Bio Format

### Project Summary:
**TenderOS** is an AI-powered Government Procurement Operating System specifically optimized for the Indian public sector. The platform aggregates, audits, and generates compliant bid proposals for public tenders. 

### Key Technical Achievements:
1. **Consolidated Aggregator**: Automated ingestion from Indian government portals with schema cleaning.
2. **Hybrid OCR Routing**: Native PDF type detection routing pages between text parsing and image OCR.
3. **Grounded RAG Reference**: Custom prompt grounding showing page numbers for every citation returned by the LLM.
4. **Hobby Tier Resource Efficiency**: Staggered container startup sequences boot the entire microservice ecosystem inside a 512MB RAM environment.

### Core Technology Stack:
- **Languages/Frameworks**: Python, FastAPI, TypeScript, Next.js, HTML/CSS
- **Storage/DBs**: PostgreSQL, Redis, Qdrant, Neo4j, OpenSearch
- **Deployment**: Railway Cloud, Docker & Docker Compose
