# TenderOS System Architecture

TenderOS is an enterprise-grade, microservice-based AI procurement intelligence platform for Indian Government Procurement.

## High-Level Topology

```mermaid
graph TB
    subgraph Client Layer
        Web[Next.js 14 Web Frontend]
    end

    subgraph API Gateway Layer
        GW[FastAPI Gateway / Nginx Router]
    end

    subgraph Microservices Layer
        TS[Tender Service - Port 8002]
        CS[Connector Service - Port 8003]
        SS[Scheduler Service - Port 8004]
        DP[Document Pipeline - Port 8005]
        CLS[Classification Service - Port 8008]
        KGS[Knowledge Graph Service - Port 8009]
        CPS[Copilot Service - Port 8011]
        MIS[Market Intelligence Service - Port 8014]
        PS[Proposal Service - Port 8017]
        BS[Billing Service - Port 8020]
        GS[Governance Service - Port 8021]
        DQS[Data Quality Service - Port 8022]
    end

    subgraph Data & AI Infrastructure
        PG[(PostgreSQL 17)]
        RD[(Redis 7)]
        QD[(Qdrant 1.13)]
        NEO[(Neo4j 5)]
        OS[(OpenSearch 2.14)]
        MIN[(MinIO S3)]
        RMQ[(RabbitMQ 3.13)]
        GEM[Google Gemini 2.0 Flash]
    end

    Web --> GW
    GW --> TS & CS & SS & DP & CLS & KGS & CPS & MIS & PS & BS & GS & DQS

    TS --> PG & OS
    CS --> RMQ --> DP
    DP --> QD & MIN & PG
    KGS --> NEO
    CPS --> QD & RD & PG & GEM
    PS --> PG & GEM
    MIS --> PG
```

## Key Architectural Principles

1. Async & Event-Driven: Crawlers push discovered tenders to RabbitMQ; background workers consume and process asynchronously.
2. Hybrid Retrieval: Search uses dense vector embeddings (SentenceTransformers + Qdrant) combined with BM25 full-text indexing (OpenSearch).
3. Graph Intelligence: Neo4j captures supplier networks, consortium linkages, and joint venture histories.
4. Resilient Crawling: Connectors handle rate limits, SSL bypass for legacy government portals, and multi-page pagination.
5. Zero Mock Policy: Production pipelines execute real database queries, vector similarity lookups, and LLM reasoning.
