# Slide Presentation Content — TenderOS v1.0.0
**B.Tech Major Project Defense Slide Deck**

---

### Slide 1: Title Slide
* **Title**: TenderOS: AI-Powered Government Procurement Operating System
* **Sub-Title**: B.Tech Major Project Presentation
* **Presenter**: Keshav Gupta (B.Tech Computer Science & Engineering)
* **Under the Guidance of**: [Project Guide Name]

---

### Slide 2: Problem Statement
* **The Challenges in Public Procurement**:
  - Millions of tenders published daily across fragmented portals (GeM, CPPP, Railways).
  - High barrier to entry for Small & Medium Enterprises (SMEs) due to complex notice Invite Tender (NIT) rules.
  - Manual compliance analysis on multi-page PDF files takes hours.
  - No automated tool to check EMD waivers, local supplier preferences, and draft technical bid outlines.

---

### Slide 3: Project Objectives
* **What TenderOS Accomplishes**:
  - **Aggregation**: Scrape, normalize, and pool tenders from multiple portals.
  - **OCR Document Intelligence**: Extract structured parameters from scanned and text PDFs.
  - **Hybrid Search**: Offer BM25 keyword + dense semantic vector search with rank fusion.
  - **Tender Copilot**: Provide grounded, cited AI Q&A answering per-tender queries.
  - **Bid Generator**: Auto-draft compliant technical proposals leveraging company digital twins.

---

### Slide 4: System Architecture
* **Event-Driven Microservices Topology**:
  - Unified FastAPI Gateway.
  - Asynchronous Redis Ingestion Queue (`tenderos:ingestion_queue`).
  - Isolated microservices (auth, tender, search, copilot, proposal).
  - Managed persistence layer: PostgreSQL and Qdrant.

---

### Slide 5: Key Technical Modules
* **Ingestion Module**: Web scrapers + HTML normalizers mapping schemas.
* **OCR Module**: Choosing between `pdfplumber` (text) and `pytesseract` (scanned PDF).
* **Search Module**: Reciprocal Rank Fusion (RRF) combining keyword and dense embeddings.
* **Copilot Module**: RAG query grounding with page-level source references.
* **Proposal Module**: Comparison of company variables (GST, PAN, Udyam MSME) with tender rules.

---

### Slide 6: Database Entity-Relationship (ER) Model
* **Relational Design (PostgreSQL)**:
  - Isolated `tenants` and `users` tables.
  - Structured `tenders`, `corrigenda`, and `award_records`.
  - Company digital twin tables (`companies`, `company_turnover`, `company_experience`).
  - System logs tracking indices and execution.

---

### Slide 7: Live System Demo Walkthrough
* **Primary Client Flows**:
  1. **User Sign In**: Safe JWT issuance and validation.
  2. **Dashboard**: View aggregate graphs and watchlists.
  3. **Hybrid Search**: Query tenders with real-time ranking.
  4. **Tender Copilot**: Interactively chat with PDF documents.
  5. **Proposal Drafting**: Generate structured technical proposals instantly.

---

### Slide 8: Verification & Latency Results
* **Performance Benchmarks (100 Runs)**:
  - **Gateway Status**: 100% healthy, zero connection timeouts.
  - **P50 Latency**: `525.87 ms`
  - **P95 Latency**: `889.49 ms`
  - **Average Latency**: `589.31 ms`
  - **Container RAM Usage**: `431.7 MB` (Under 512MB limit).
* **Security Headers**: HSTS, CSP, X-Frame-Options, XSS Filter fully active.

---

### Slide 9: Advantages & Limitations
* **Advantages**:
  - Drastically lowers bid preparation times for SMEs.
  - Ensures compliance with GFR 2017 rules.
* **Limitations**:
  - Relies on internet connectivity for LLM APIs.
  - Scrapers need updates if portal layouts change.

---

### Slide 10: Future Scope & Conclusion
* **Future Roadmap**:
  - Add support for on-premise local models (e.g. Llama 3) to run offline.
  - Implement automated digital signing (DSC) integrations.
* **Conclusion**:
  - TenderOS v1.0.0 represents a production-ready, industry-grade procurement operating system.

---

### Slide 11: Questions & Answers (Q&A)
* **Thank You!**
* *Opened for questions from the evaluation committee.*
