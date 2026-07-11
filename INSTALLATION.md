# Installation & Setup Guide — TenderOS v1.0.0

This guide details the steps required to install, build, and run the TenderOS platform locally, in Docker container environments, on Railway hosting, and Vercel.

---

## 1. Local Developer Setup (Bare Metal)

### 1.1 Prerequisites
- **Python**: v3.11+
- **Node.js**: v20+ & npm v10+
- **PostgreSQL**: v16+
- **Redis**: v7+

### 1.2 Database & Caching Initialization
1. Start your local PostgreSQL server and create a database named `tenderos`:
   ```sql
   CREATE DATABASE tenderos;
   ```
2. Initialize tables and schema indices:
   ```bash
   psql -h localhost -U postgres -d tenderos -f infrastructure/postgres/init.sql
   ```
3. Start local Redis caching:
   ```bash
   redis-server
   ```

### 1.3 Running Microservices
1. Clone the repository and navigate to the project root.
2. Initialize virtual environment and install backend dependencies:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Set environment parameters in a local `.env` file at the root:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/tenderos
   SECRET_KEY=tenderos_local_dev_key_2026
   GEMINI_API_KEY=AIzaSy...
   ```
4. Start backend components sequentially using uvicorn or the start script:
   ```bash
   ./start.sh
   ```

### 1.4 Running Next.js Frontend
1. Navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:18000
   ```
4. Start development web server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your web browser.

---

## 2. Docker Containerized Run

The simplest way to run the entire TenderOS stack locally is with Docker Compose:

### 2.1 Start Infrastructure and Microservices
Build and start all 22 microservices and database containers:
```bash
docker-compose -f docker-compose.local.yml up --build -d
```

### 2.2 Verify Running Services
List active containers and verify health:
```bash
docker ps
```
The gateway service will bind to port `18000` on localhost.

---

## 3. Production Deploy: Railway (Backend)

The production backend runs on Railway:

### 3.1 CLI Initialization
1. Log in to your Railway account:
   ```bash
   railway login --browserless
   ```
2. Link or initialize the project:
   ```bash
   railway init --name tenderos
   ```

### 3.2 Provision Databases & Services
1. Add PostgreSQL database service:
   ```bash
   railway add --database postgres
   ```
2. Add empty backend service template:
   ```bash
   railway add --service backend
   ```

### 3.3 Set Env Variables & Deploy
1. Configure required environment variables:
   ```bash
   railway vars set \
     DATABASE_URL="${{Postgres.DATABASE_URL}}" \
     SECRET_KEY="production_sec_key_2026" \
     CORS_ORIGINS='["*"]' \
     GEMINI_API_KEY="AIzaSy..."
   ```
2. Upload and deploy project:
   ```bash
   railway up
   ```

---

## 4. Production Deploy: Vercel (Frontend)

Deploy the Next.js frontend with production optimizations on Vercel:

1. Install Vercel CLI locally:
   ```bash
   npm install -g vercel
   ```
2. Navigate to the frontend workspace:
   ```bash
   cd apps/frontend
   ```
3. Deploy to Vercel:
   ```bash
   vercel --prod
   ```
4. During setup, configure the production environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://backend-production-4aa8.up.railway.app`
