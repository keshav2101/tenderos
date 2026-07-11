# Project Report — TenderOS: AI Procurement Operating System
**B.Tech Major Project Thesis Report**

---

## 1. Abstract

Modern government procurement portals in India, including the Government e-Marketplace (GeM) and Central Public Procurement Portal (CPPP), process millions of notices daily. However, extracting actionable bid intelligence, ensuring regulatory compliance (e.g., GFR 2017 Rules), and drafting technical bid submissions remains a manual, error-prone, and time-intensive task for Small & Medium Enterprises (SMEs).

This thesis presents **TenderOS**, an event-driven microservices platform that automates the aggregate ingestion, semantic indexing, compliance auditing, and drafting of public bids. Operating behind a unified FastAPI gateway, TenderOS features a multi-tiered OCR document pipeline, hybrid vector semantic retrieval (BM25 + Dense embeddings), and a Retrieval-Augmented Generation (RAG) Tender Copilot with page-level source citation. The platform is successfully validated on Railway with production-grade TLS and HSTS security configurations.

---

## 2. Introduction & Objectives

### 2.1 Context
In India's GovTech space, small businesses struggle to win bids due to the high complexity of Notice Inviting Tender (NIT) requirements and strict eligibility checks (turnover, past experience, EMD deposit clauses).

### 2.2 Objectives
1. **Consolidated Aggregation**: Automatically crawl and clean tenders across CPPP, GeM, Railways (IREPS), and State portals.
2. **AI Document Intelligence**: Automatically perform OCR layout recognition to process text-based and scanned PDF contracts.
3. **Grounded Q&A (Tender Copilot)**: Ground LLM answers inside tender documents to generate verified page-level source citations.
4. **Automated Bid Builder**: Generate technical bid drafts that check GST, PAN, and Udyam MSME exceptions.

---

## 3. Literature Survey

### 3.1 Traditional Keyword Search vs. Vector Retrieval
Standard keyword matching engines (e.g. TF-IDF, BM25) often fail to capture semantic intent, missing matching tenders if synonyms are used. Hybrid search frameworks combining dense vector embeddings with BM25 keyword rankings have proven superior in document retrieval tasks.

### 3.2 Retrieval-Augmented Generation (RAG)
Large Language Models (LLMs) suffer from hallucinations. RAG architectures address this by injecting retrieved document snippets into the LLM prompt context, restricting output generation to grounded facts.

---

## 4. Methodology & Architecture

TenderOS is organized into 11 distinct intelligence layers built with a microservice architecture.

```
       Client Request (Next.js App)
                    │
                    ▼
         API Gateway Router (FastAPI)
         ├─ Routing & Rate Limiter
         └─ JWT Auth & Role Checks
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
   Core Services          ML & AI Services
   ├─ auth-service        ├─ search-service (Qdrant)
   ├─ tender-service      ├─ copilot-service (RAG)
   └─ scheduler-service   └─ proposal-service
```

- **Event Loop & Ingestion**: Tenders are pushed to Redis lists (`tenderos:ingestion_queue`) by normalizers and fetched by asynchronous consumer threads.
- **RAG Routing**: Queries query local databases to extract context pages before prompting LLMs.

---

## 5. Algorithmic Specifications

### 5.1 Hybrid Search Rank Fusion (RRF)
To merge keyword and vector semantic lists without score normalization scaling issues:

$$\text{RRF Score}(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

Where:
* $M$ is the set of search algorithms (BM25 and Semantic Vector).
* $r_m(d)$ is the rank of document $d$ in the result list of algorithm $m$.
* $k$ is a constant parameter (default: 60) to smooth rank values.

### 5.2 Document OCR Choice Routing
For every tender document attachment:
- If PDF has extractable text layers, parse using `pdfplumber`.
- If PDF is scanned, run `pytesseract` OCR processing (300 DPI scaling).

---

## 6. Implementation & Technology Stack

- **Frameworks**: FastAPI (Python 3.11), Next.js 14 (TypeScript)
- **Databases**: PostgreSQL 16 (Relational schemas, trigram indices), Redis 7 (Token store, job queues), Qdrant 1.9 (Semantic vector store)
- **Infrastructure**: Railway cloud provider.

---

## 7. Performance & Test Results

- **Median Gateway Response (P50)**: `525.87 ms`
- **Tail Latency (P95)**: `889.49 ms`
- **Security Check**: Verified 100% compliance on HSTS (`max-age=63072000`) and CSP policies.
- **Microservices Footprint**: Total memory footprint is `431.7 MB` under full execution load.

---

## 8. Advantages, Limitations, and Future Scope

### 8.1 Advantages
- Eliminates manual document scanning via automated OCR.
- Generates fully compliant bid drafts in seconds.

### 8.2 Limitations
- Requires external LLM API connectivity (e.g. Gemini API) for advanced document extraction and generation.

### 8.3 Future Scope
- Integrating local on-premise LLMs (e.g. Llama 3) to run compliance checks and generation locally, completely bypassing cloud LLM costs and data privacy concerns.

---

## 9. References

1. Vaswani, A., et al. "Attention is all you need." *Advances in Neural Information Processing Systems*, 2017.
2. GFR 2017, Ministry of Finance, Government of India. "General Financial Rules."
3. Robertson, S., et al. "The Probabilistic Relevance Framework: BM25 and Beyond." *Information Retrieval*, 2009.
