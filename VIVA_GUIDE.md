# Viva Defense Guide — TenderOS v1.0.0
**50+ Questions and Answers for the Major Project Viva Examination**

---

## 1. System Architecture & Design Patterns (Q1 - Q15)

#### Q1: What is the overall architectural pattern of TenderOS?
**A**: TenderOS uses an event-driven microservice architecture. Services are isolated by function and sit behind a unified FastAPI gateway proxy. Internal communications use HTTP and an asynchronous Redis ingestion queue.

#### Q2: Why did you choose microservices over a monolithic architecture?
**A**: Microservices isolate process workloads. In our system, CPU-intensive document processing (OCR parsing) and vector indexing runs independently without impacting high-throughput read paths like the tender list Feed or user login routes.

#### Q3: What is the role of the API Gateway?
**A**: The API Gateway (built with FastAPI and Uvicorn) acts as the single entry point. It handles user authentication (JWT token validations), routes traffic to downstream microservices, limits client requests to prevent brute force attacks, and enforces secure headers.

#### Q4: How do the microservices communicate with each other?
**A**: Synchronous queries (e.g. asking the Copilot a question or requesting user profiles) are routed via HTTP REST requests. Asynchronous workloads (e.g. connector scraping or PDF analysis jobs) use Redis lists (`LPUSH` / `BRPOP` queues).

#### Q5: What is the benefit of using `start.sh` with background execution groups?
**A**: Since microservices consume CPU/RAM on startup, booting all 22 services simultaneously would cause out-of-memory (OOM) spikes on resource-constrained instances. `start.sh` runs services in the background using a staggered 2-second sleep delay, limiting peak booting memory footprint.

#### Q6: How does the Gateway route public paths vs protected paths?
**A**: The Gateway features an `AuthMiddleware` checking request paths against a predefined `PUBLIC_PATHS` list. If the route matches (e.g., `/health`, `/api/v1/tenders`), the request passes without validation headers; otherwise, a valid Bearer JWT is mandated.

#### Q7: Why did you choose FastAPI over Flask or Django?
**A**: FastAPI offers native asynchronous (`async`/`await`) request loops, high-performance serialization via Pydantic, and automatic OpenAPI documentation generation.

#### Q8: How does the Scheduler Service run cron tasks without blocking?
**A**: It runs on an asynchronous worker loop. When a task is due, it fires the task logic to the Connector service via HTTP and immediately returns to sleep, keeping execution non-blocking.

#### Q9: What happens if a microservice crashes?
**A**: In production (Railway), containers automatically restart the failed service processes. Locally, uvicorn subprocess pools handles restarts.

#### Q10: How does the system handle CORS issues?
**A**: CORS middleware is active in the API Gateway and downstream services, validating requests. In production, we permit wildcard requests to simplify Next.js routing.

#### Q11: Describe the tender ingestion pipeline flow.
**A**: Scheduler triggers Connector -> Connector queries portals and normalizes data -> push to Redis list -> Tender service worker pops, saves to PostgreSQL, and indexes data.

#### Q12: How are duplicate tenders prevented?
**A**: By enforcing a unique constraint on the `tender_id` field in PostgreSQL database. Attempts to insert duplicate IDs are captured and ignored by the database driver.

#### Q13: What is the function of the Digital Twin service?
**A**: It models corporate registration documents (GST, Udyam MSME, PAN) to verify company qualification parameters.

#### Q14: How is load balancing managed?
**A**: Railway's edge proxy handles external load balancing.

#### Q15: How does the Gateway measure request processing duration?
**A**: Using middleware that records the start timestamp of a request, awaits downstream processing, and appends the calculated time to the response as `X-Process-Time-Ms`.

---

## 2. Database & Data Model (Q16 - Q25)

#### Q16: Why did you use PostgreSQL as your primary database?
**A**: PostgreSQL is an enterprise-grade ACID-compliant database. It supports complex relational mapping, foreign keys, array fields, and advanced text indexes like Trigram.

#### Q17: What are the primary tables in your PostgreSQL schema?
**A**: `tenants`, `users`, `tenders`, `tender_documents`, `companies`, `company_turnover`, `company_experience`, `watchlists`, and `sync_jobs`.

#### Q18: What is the purpose of GIN (Generalized Inverted Index) indices?
**A**: We use GIN indices on array columns like `tenders.categories` to enable rapid query matching of array elements, and on Trigram fields for fast partial-string search.

#### Q19: What is a Trigram index?
**A**: Trigrams split strings into three-letter combinations. A GIN index on trigrams (`pg_trgm` extension) allows the database to execute fast wildcards searches (`ILIKE '%query%'`) on large columns like ministry names.

#### Q20: Explain the relationship between `users` and `tenants`.
**A**: A many-to-one relationship. Every user belongs to exactly one tenant organization (`users.tenant_id` references `tenants.id`), supporting secure corporate isolation.

#### Q21: How is the database connected securely on Railway?
**A**: By binding internal connections to the private VPC hostname `postgres.railway.internal`, which is inaccessible from the public internet.

#### Q22: What is the purpose of the `refresh_tokens` table?
**A**: It persists refresh tokens. If a token is stolen, administrators can delete the record in this table to immediately revoke session privileges.

#### Q23: Why do we have an `emd_exempt_allowed` boolean on the tenders table?
**A**: Under General Financial Rules (GFR) 2017 Rule 170, registered MSMEs/Startups are exempt from EMD deposits. The boolean tracks if the tender allows exemption.

#### Q24: How does the database handle concurrent writes?
**A**: Via connection pooling managed by `asyncpg`, allowing up to 20 concurrent transactions per service.

#### Q25: How did you execute migrations on the live database?
**A**: Since `psql` was absent on the local host machine, we executed migrations using a Python script utilizing `asyncpg` that connected directly to the database TCP proxy.

---

## 3. Artificial Intelligence & RAG Copilot (Q26 - Q35)

#### Q26: Explain the 3-Tier AI Extraction pipeline.
**A**: 
- Tier 1: RegEx / spaCy rules for basic structured metadata.
- Tier 2: Small local models for table extractions.
- Tier 3: Gemini 2.0 Flash for complex layouts.

#### Q27: What is RAG?
**A**: Retrieval-Augmented Generation. It inputs relevant document context into the LLM prompt, ensuring the generated answers are grounded in the document text.

#### Q28: How does the Copilot find relevant text chunks?
**A**: Under standard setups, it uses vector similarity. In our local setup, it searches the `tender_document_chunks` table for matching records.

#### Q29: How do page-level citations work?
**A**: Document processors save the page number of every extracted chunk. When the Copilot retrieves context, it appends these numbers as source citations.

#### Q30: Why use Gemini 2.0 Flash?
**A**: It features a large context window, fast inference speeds, and is cost-efficient.

#### Q31: What is the role of `sentence-transformers`?
**A**: To generate dense vector embeddings from text chunks.

#### Q32: What model is used for embeddings?
**A**: `all-MiniLM-L6-v2` (384-dimensional dense vectors).

#### Q33: How does the OCR pipeline choose between pdfplumber and tesseract?
**A**: It pings the PDF file structure. If text layers exist, it parses via `pdfplumber`; otherwise, it renders pages as images and runs `pytesseract`.

#### Q34: What is the purpose of the `QDRANT_HOST="disabled"` fallback?
**A**: It allows the system to run on database fallback queries if the vector database is offline.

#### Q35: How does the proposal generator use AI?
**A**: It reads compliance criteria and outputs structured sections.

---

## 4. Security & Hardening (Q36 - Q45)

#### Q36: How are user sessions protected?
**A**: Via JWT tokens signed with a server-side secret key.

#### Q37: How is password storage secured?
**A**: Using bcrypt hashing.

#### Q38: What are HSTS headers?
**A**: HTTP Strict Transport Security. It forces browsers to only connect via HTTPS.

#### Q39: What is Clickjacking prevention?
**A**: Enforced by setting `X-Frame-Options: DENY`, blocking the app from being rendered inside an iframe.

#### Q40: What is MIME-sniffing prevention?
**A**: Enforced by setting `X-Content-Type-Options: nosniff`.

#### Q41: Explain CSP (Content Security Policy).
**A**: Restricts what script sources the browser is allowed to execute.

#### Q42: What is the risk of using wildcard CORS in production?
**A**: It allows any site to request resources, creating CSRF vulnerabilities.

#### Q43: How are secrets kept safe?
**A**: By storing them as platform environment variables.

#### Q44: What is the benefit of `asyncpg` over standard `psycopg2`?
**A**: It is written in pure Python/C, running on async loops for higher throughput.

#### Q45: How are brute-force attacks mitigated?
**A**: Via rate-limiting filters on login routes.

---

## 5. Deployment & Performance (Q46 - Q50)

#### Q46: How is Railway configured?
**A**: Via `railway.json` defining build steps, start command, and health check routes.

#### Q47: What is the performance profile of the live backend?
**A**: Average response latency of **`589.31 ms`** and 100% success rate under load.

#### Q48: Why did you transition from GCP to Railway?
**A**: GCP required active billing configurations. Railway offered container runtimes and SQL instances in one place.

#### Q49: How do you perform a rollback?
**A**: By running `railway deployment redeploy <id>`.

#### Q50: How is database persistence maintained?
**A**: By mounting a Railway persistent volume (`/var/lib/postgresql/data`) to the Postgres database container.
