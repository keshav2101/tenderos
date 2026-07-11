# Production Live URLs — TenderOS v1.0.0

This document compiles the hosted endpoints, databases, and monitoring URLs for the production release of TenderOS.

---

## 1. Public Entry Points

- **Frontend Client Application**: [https://tenderos-neon.vercel.app](https://tenderos-neon.vercel.app)
  - Next.js SPA hosting user login, dashboards, search query panels, and AI bid proposal generation forms.
- **Production API Gateway**: [https://backend-production-4aa8.up.railway.app](https://backend-production-4aa8.up.railway.app)
  - Unified microservices entry router.

---

## 2. API Observability & Health Endpoints

- **Live Gateway Check**: `GET` [https://backend-production-4aa8.up.railway.app/health](https://backend-production-4aa8.up.railway.app/health)
- **Deep Integration Check**: `GET` [https://backend-production-4aa8.up.railway.app/health/deep](https://backend-production-4aa8.up.railway.app/health/deep)
- **Prometheus Metrics**: `GET` [https://backend-production-4aa8.up.railway.app/metrics](https://backend-production-4aa8.up.railway.app/metrics)

---

## 3. Database Connectivity (External TCP Proxy)

For administrator access, the PostgreSQL database is exposed via a secure public TCP proxy:

- **Host Domain**: `tramway.proxy.rlwy.net`
- **Port**: `40786`
- **Database Name**: `railway`
- **Username**: `postgres`
- **Connection String**: `postgresql://postgres:hMftELunyqDbdAjJlHsKStplLhgrPOgG@tramway.proxy.rlwy.net:40786/railway`
