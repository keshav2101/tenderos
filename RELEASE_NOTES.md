# Release Notes — TenderOS v1.0.0 (College Release)
**Release Date**: July 11, 2026

We are proud to announce the General Availability (GA) of **TenderOS v1.0.0**, designed specifically for submission as a B.Tech Major Project. This release consolidates all microservices and databases into a fully validated production environment hosted on Railway, linked with a responsive Next.js frontend.

---

## 🌟 Key Features in v1.0.0

### 1. Unified Indian Procurement Data Pipeline
- Aggregates notice Inviting Tenders (NIT) and Bill of Quantities (BOQ) from CPPP, GeM, Railways, PSUs, and municipal portals.
- Automated data normalization pipelines handling state/central jurisdictions.

### 2. Multi-Service API Gateway
- Single entry-point FastAPI Router routing client traffic across distributed microservices.
- Hardened CORS controls and pre-route rate limiting.

### 3. Document Layout OCR Intelligence
- Automatic layout recognition processing text-based and scanned PDFs (hybrid `pdfplumber` + `pytesseract` pipeline).
- Document segmentation to maintain semantic layout references.

### 4. Semantic Search & RAG Copilot
- High-relevance search queries using hybrid rankings.
- Grounded per-tender RAG conversation with citation referencing (source page numbers).

### 5. Automated Proposal & Bid Generator
- Automated evaluation comparing company profile data (GST, Udyam MSME, PAN) with tender requirements.
- Formatted technical bid response drafting.

---

## 🛠️ Release Bugfixes & Hardening

* **Import Crash Resolution**: Installed missing `email-validator` dependency.
* **Router Attribute Error Fix**: Upgraded `prometheus-fastapi-instrumentator>=8.0.2` to ensure compatibility with modern FastAPI router configurations.
* **Security hardheaders**: Applied HSTS, CSP, X-Frame-Options, X-XSS-Protection, and Referrer-Policy headers.
* **Database Migration Integration**: Initialized full schema tables on Railway Postgres.
