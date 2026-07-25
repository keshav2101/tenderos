# Railway Deployment Report — TenderOS v1.0.0

This report documents the containerized deployment of the API Gateway and backend microservices, active environment variables, database volumes, and live health status on Railway.

---

## 1. Project Specifications

* **Workspace Name**: `KESHAV GUPTA's Projects`
* **Project ID**: `1b6ee705-9b14-4285-bba0-ceeb7fa921a2`
* **Region**: `sfo` (US West / San Francisco)
- **Backend Service Name**: `backend` (ID: `ab54e7c2-2120-4041-af2e-3f70f9a12eb8`)
- **Postgres Service Name**: `Postgres` (ID: `c54c7efb-b3af-4c93-9209-26fa60ed6801`)

---

## 2. PostgreSQL Configuration & Volume Mounting

- **Status**: ● Online
- **Active Connections**: 20 maximum connections.
- **Persistent Volume Mounted**: `postgres-volume` mounted to path `/var/lib/postgresql/data`.
- **Private Domain**: `postgres.railway.internal`
- **Dynamic Binding**: `DATABASE_URL` references `${{Postgres.DATABASE_URL}}` ensuring database queries resolve inside the private network.
- **Schema State**: Fully initialized with 33 schema tables by executing `init.sql` against the database client.

---

## 3. Environment Variables Map

The following configurations are active on the running `backend` container:

* `CORS_ORIGINS`: `["*"]`
* `ENVIRONMENT`: `production`
* `DEBUG`: `false`
* `WORKERS`: `1`
* `REDIS_HOST`: `127.0.0.1`
* `REDIS_PORT`: `6379`
* `QDRANT_HOST`: `disabled`
* `OPENSEARCH_HOST`: `disabled`
* `GEMINI_API_KEY`: `placeholder_set_in_railway_dashboard`
* Microservice URLs (`AUTH_SERVICE_URL`, `TENDER_SERVICE_URL`, etc.) are mapped to loopback IP ports (`127.0.0.1:8001`-`8019`) to keep internal traffic locked within the container.

---

## 4. Live Health Check Verifications

The deployment is verified fully operational:
- **Edge URL**: `https://backend-production-4aa8.up.railway.app`
- **Health Response**:
  ```json
  {"status":"healthy","service":"api-gateway","version":"1.0.0"}
  ```
- **Deep Health Response**:
  ```json
  {
    "status":"healthy",
    "critical_services":{
      "auth":{"status":"healthy"},
      "tender":{"status":"healthy"},
      "search":{"status":"healthy"},
      "copilot":{"status":"healthy"}
    }
  }
  ```
- **Container Logs Status**: Clean startup. Staggered microservice launch loops run successfully. Uvicorn listening on port 8080.
