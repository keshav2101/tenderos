# System Architecture — TenderOS v1.0.0

This document describes the architectural patterns, service topologies, data flows, and runtime sequences of the TenderOS platform.

---

## 1. System Topology & Microservices Map

TenderOS uses a service-oriented event-driven architecture, decoupled via RESTful gateway proxies and an in-memory Redis message bus.

```mermaid
graph TD
    %% Client & Gateway
    Client[Next.js Client] -->|HTTPS / WSS| GW[API Gateway:8080]

    %% Middleware
    GW -->|Routing & Auth| AuthMW[Auth & Rate Limit Middleware]
    
    %% Core microservices
    GW -->|REST Proxy| AuthSvc[auth-service:8001]
    GW -->|REST Proxy| TenderSvc[tender-service:8002]
    GW -->|REST Proxy| ConnSvc[connector-service:8003]
    GW -->|REST Proxy| SchedSvc[scheduler-service:8004]
    GW -->|REST Proxy| SearchSvc[search-service:8010]
    GW -->|REST Proxy| CopilotSvc[copilot-service:8011]
    GW -->|REST Proxy| PropSvc[proposal-service:8017]
    GW -->|REST Proxy| NotifSvc[notification-service:8018]
    GW -->|REST Proxy| AdminSvc[admin-service:8019]
    GW -->|REST Proxy| DTSvc[digital-twin-service:8012]

    %% Shared resources
    AuthSvc --> PG[(Railway PostgreSQL)]
    TenderSvc --> PG
    TenderSvc --> RD[(Redis Queue)]
    SearchSvc --> PG
    SearchSvc --> RD
    CopilotSvc --> PG
    CopilotSvc --> RD
    ConnSvc --> RD
    SchedSvc --> RD
```

---

## 2. Deployment Diagram

Deployments are hosted across a dual cloud structure utilizing **Vercel** for the client-side single page application (SPA) and **Railway** for containerized API microservices and data nodes.

```mermaid
graph TB
    subgraph Vercel Cloud
        FE[SPA Frontend]
    end
    
    subgraph Railway VPC
        direction LR
        GW[API Gateway Router]
        
        subgraph Backend Cluster
            MS[Microservices Containers]
        end
        
        subgraph Database Layer
            PG[(PostgreSQL DB)]
            RD[(Redis Server)]
        end
        
        GW --> MS
        MS --> PG
        MS --> RD
    end
    
    FE -->|Public Edge Router| GW
```

---

## 3. Data Flow Diagrams

### 3.1 Tender Ingestion Pipeline
How tenders are scraped, normalized, queued, and indexed:

```mermaid
sequenceDiagram
    autonumber
    participant SC as Scheduler Service
    participant CO as Connector Service
    participant RD as Redis Ingestion Queue
    participant TE as Tender Service Worker
    participant DB as PostgreSQL
    participant SE as Search Service (DB fallback)

    SC->>CO: Trigger Ingestion (Cron / API)
    CO->>CO: Query Portals (GeM, CPPP, Railways)
    CO->>CO: Normalize & Clean Metadata
    CO->>RD: LPUSH raw payload into tenderos:ingestion_queue
    TE->>RD: BRPOP payload (worker thread)
    TE->>TE: Check Duplicates & MSME Rules
    TE->>DB: INSERT into tenders table
    TE->>SE: Call /search/index
    SE->>DB: Index text content & create facets
```

---

## 4. Sequence Flows

### 4.1 Authentication & Registration Flow
How JWT session authorization is initiated and validated:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant GW as API Gateway
    participant AU as Auth Service
    participant DB as PostgreSQL

    User->>GW: POST /api/v1/auth/login (credentials)
    GW->>AU: Proxy Login Request
    AU->>DB: Select user where email = ?
    DB-->>AU: User entity & hashed password
    AU->>AU: Verify bcrypt hash
    AU->>AU: Sign Access Token (JWT) & Refresh Token
    AU-->>GW: Token Payload
    GW-->>User: 200 OK + JWT Headers
```

### 4.2 AI Copilot RAG Flow
How document-specific queries are parsed, grounded, and cited:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant GW as API Gateway
    participant CO as Copilot Service
    participant DB as PostgreSQL

    User->>GW: POST /api/v1/chat/{tender_id} (question)
    GW->>GW: Validate JWT token
    GW->>CO: Forward payload
    CO->>DB: Query tender_document_chunks where tender_id = ?
    DB-->>CO: Text chunks (context)
    CO->>CO: Assemble prompt context with citations
    CO->>CO: Query LLM (Gemini Flash / fallback)
    CO-->>GW: Grounded response + citation pages
    GW-->>User: JSON reply
```

### 4.3 Proposal Generator Flow
How a bid response is generated:

```mermaid
sequenceDiagram
    autonumber
    actor User as Bid Manager
    participant GW as API Gateway
    participant PR as Proposal Service
    participant DB as PostgreSQL
    participant DT as Digital Twin Service

    User->>GW: POST /api/v1/proposals/generate
    GW->>PR: Forward generation request
    PR->>DB: Get tender details (specifications, EMD)
    PR->>DT: Get Company compliance profiles (GST, Udyam MSME, PAN)
    DT-->>PR: GST & Udyam Details
    PR->>PR: Match qualification criteria and exceptions
    PR->>PR: Compile technical response outline
    PR->>DB: Save to proposals table
    PR-->>User: Completed technical proposal document
```

---

## 5. Monitoring & Health Routing Flow

How Prometheus metrics and health checks are routed:

```mermaid
graph TD
    Prom[Prometheus Server] -->|Scrape /metrics| GW[API Gateway]
    Prom -->|Scrape /metrics| SVCS[Microservices]
    
    GatewayCheck[Health Check Scheduler] -->|GET /health/deep| GW
    GW -->|Internal TCP| S1[auth-service]
    GW -->|Internal TCP| S2[tender-service]
    GW -->|Internal TCP| S3[search-service]
```
