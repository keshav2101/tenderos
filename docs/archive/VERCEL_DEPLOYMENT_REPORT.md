# Vercel Deployment Report — TenderOS v1.0.0

This report documents the cloud deployment of the Next.js frontend application on Vercel, configurations, and environment bindings.

---

## 1. Project Specifications

* **Vercel Scope**: `keshav2101s-projects`
- **Project Name**: `tenderos`
- **Deployment ID**: `dpl_8e1VhuaU3PtumtmXjCCjTgmB8xqX`
- **Production URL**: `https://tenderos-9tdlcju9l-keshav2101s-projects.vercel.app`
- **Aliased Domain**: [https://tenderos-neon.vercel.app](https://tenderos-neon.vercel.app)

---

## 2. Next.js Build Parameters

- **Next.js Version**: `16.2.10 (Turbopack)`
- **Build Command**: `npm run build`
- **Output Directory**: `.vercel/output`
- **Target runtime**: Node.js v25.8.1

### Compile Checks:
- Compiles with **`0 errors`** during static site generation.
- Prerenders static pages: `/`, `/login`, `/register`, `/dashboard`, `/dashboard/watchlist`, and `/dashboard/search`.
- Dynamic server side route is active for tender details page: `/dashboard/tenders/[id]`.

---

## 3. Environment Variables Configuration

The following variable is active on the production deployment to link the frontend to our backend:

| Variable Name | Configured Production Value | Description |
|---|---|---|
| **`NEXT_PUBLIC_API_URL`** | `https://backend-production-4aa8.up.railway.app` | Live Railway API Gateway Endpoint URL |

---

## 4. Frontend Functional Verification

- **Landing Page**: Loads successfully returning HTML document structure.
- **API Call Connection**: Verified client requests successfully fetch static endpoints and return JSON datasets from the live Railway gateway.
