# TenderOS v1.0.0 — API Reference

> **Base URL:** `https://api.tenderos.in` (production) | `http://localhost:8000` (development)
> 
> **Authentication:** All endpoints (except `/auth/*` and `/health`) require a Bearer JWT token.

---

## Authentication

### POST /api/v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@tenderos.in",
  "password": "AdminSecure@TenderOS2026!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "10000000-0000-0000-0000-000000000001",
    "email": "admin@tenderos.in",
    "name": "System Administrator",
    "role": "admin",
    "plan": "enterprise"
  }
}
```

**cURL example:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tenderos.in","password":"AdminSecure@TenderOS2026!"}'
```

---

### POST /api/v1/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "newuser@company.in",
  "password": "SecurePassword@2026!",
  "name": "User Full Name"
}
```

---

### POST /api/v1/auth/refresh
Refresh access token.

**Request:**
```json
{ "refresh_token": "<refresh_token>" }
```

---

## Tenders

### GET /api/v1/tenders
List tenders with optional filters.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | `gem`, `cppp`, `maharashtra`, `railways` |
| `status` | string | `active`, `closed`, `cancelled` |
| `state` | string | State name (e.g., `Maharashtra`) |
| `msme_exemption` | bool | Only tenders with MSME EMD exemption |
| `startup_eligible` | bool | Only tenders with startup relaxations |
| `make_in_india_required` | bool | Filter by MII compliance requirement |
| `min_value_lakhs` | float | Minimum estimated cost (Lakhs) |
| `max_value_lakhs` | float | Maximum estimated cost (Lakhs) |
| `category` | string | Category keyword |
| `page` | int | Page number (default: 1) |
| `limit` | int | Results per page (default: 20, max: 100) |

**cURL example:**
```bash
TOKEN="your_jwt_token"
curl "http://localhost:8000/api/v1/tenders?source=gem&status=active&msme_exemption=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

### GET /api/v1/tenders/{tender_id}
Get full tender details.

**cURL example:**
```bash
curl "http://localhost:8000/api/v1/tenders/30000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Search

### POST /api/v1/search
Hybrid semantic + keyword tender search.

**Request:**
```json
{
  "query": "AI surveillance smart city IoT cameras",
  "filters": {
    "state": "Delhi",
    "msme_exemption": true,
    "max_value_lakhs": 1000
  },
  "top_k": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "tender_id": "30000000-0000-0000-0000-000000000001",
      "title": "Supply of AI-Powered Surveillance Systems...",
      "relevance_score": 0.94,
      "source": "gem",
      "estimated_cost_lakhs": 480.0,
      "msme_exemption": false,
      "startup_eligible": true,
      "bid_deadline": "2026-07-27T23:59:00Z"
    }
  ],
  "total": 1,
  "search_mode": "hybrid"
}
```

**cURL example:**
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"AI surveillance smart city","filters":{"state":"Delhi"}}'
```

---

## AI Copilot

### POST /api/v1/copilot/ask
Ask the procurement AI Copilot a question about a tender.

> ⚠️ **The AI provides analysis, recommendations, and evidence — it does NOT make procurement decisions.**

**Request:**
```json
{
  "tender_id": "30000000-0000-0000-0000-000000000001",
  "question": "What are the MSME exemption benefits for this tender and what documents do I need?",
  "company_id": "20000000-0000-0000-0000-000000000001"
}
```

**Response:**
```json
{
  "answer": "For this GeM tender (GEM/2026/B/12345678), MSME exemption does NOT apply as this is a high-value AI surveillance tender above the MSME exemption threshold. However, if your company holds DPIIT Startup recognition, you qualify for full EMD waiver of ₹9.6 Lakhs under the Startup India Relaxation policy...",
  "confidence": 0.87,
  "sources_cited": ["GeM Buyer Manual v3.2 — Clause 4.5", "GFR 2017 Rule 144(xi)"],
  "recommendation": "ANALYSE_FURTHER",
  "disclaimer": "This is AI-generated analysis only. Final procurement decisions must be made by authorized human users."
}
```

**cURL example:**
```bash
curl -X POST http://localhost:8000/api/v1/copilot/ask \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tender_id":"30000000-0000-0000-0000-000000000001","question":"What is the EMD requirement?"}'
```

---

## Bid Qualification

### POST /api/v1/qualification/check
Run AI-powered bid qualification check for a company on a tender.

**Request:**
```json
{
  "company_id": "20000000-0000-0000-0000-000000000001",
  "tender_id": "30000000-0000-0000-0000-000000000003"
}
```

**Response:**
```json
{
  "match_score": 89,
  "eligibility_score": 95,
  "winning_probability": 72,
  "confidence": "HIGH",
  "eligible": true,
  "recommendation": "GO",
  "recommendation_reason": "Excellent ERP cloud delivery track record. MSME Udyam EMD exemption applicable...",
  "emd_applicable": false,
  "emd_exemption_reason": "Udyam Registration UDYAM-MH-05-0012345 qualifies for EMD waiver",
  "missing_documents": [],
  "key_risks": ["Price competition from large SI bidders"],
  "advantages": ["MSME EMD exemption", "Class-I local supplier preference", "3x NIC experience proof"],
  "estimated_prep_hours": 25,
  "ai_disclaimer": "This is an AI-generated recommendation. Final bid decision must be made by authorized personnel."
}
```

---

## Bid Workflows

### GET /api/v1/proposals/{tender_id}/workflow
Get current bid workflow state.

### POST /api/v1/proposals/{tender_id}/workflow/transition
Transition bid workflow state (Human-in-the-Loop approval step).

**Valid states:**
```
AI_RECOMMENDATION → TECHNICAL_REVIEW → FINANCE_REVIEW → LEGAL_REVIEW 
  → MANAGEMENT_APPROVAL → BID_SUBMISSION → TECHNICAL_BID_SUBMITTED
  → TECHNICAL_EVALUATION → FINANCIAL_BID_OPENED → L1_DETERMINED
  → AWARD_LOA → AGREEMENT_SIGNED → WORK_ORDER_ISSUED → EXECUTION
  → INVOICE_SUBMITTED → PAYMENT_RELEASED → COMPLETION_CERTIFICATE → PBG_RELEASE
```

**Request:**
```json
{
  "target_state": "TECHNICAL_REVIEW",
  "user_role": "enterprise"
}
```

---

## Analytics & Intelligence

### GET /api/v1/intelligence/recommendation/{tender_id}
Get AI market intelligence recommendation for a tender.

**Response includes:**
- Market demand score
- Competition analysis
- Win probability estimate
- Risk factors
- Strategic recommendations
- ⚠️ Always labelled as AI recommendations, not decisions

---

## Digital Twin

### GET /api/v1/digital-twin/profile/{company_id}
Get company digital twin profile with compliance scores.

**Response includes:**
- GST / PAN / CIN / Udyam / DPIIT registration status
- EMD exemption eligibility
- Tender win history
- Compliance score (0–100)
- Open bid workflows

---

## Admin

### GET /api/v1/admin/users
List all users (admin only).

### GET /api/v1/admin/stats
Platform-wide statistics (admin only).

### GET /api/v1/admin/connectors
Connector health status and last sync times.

---

## Health Checks

### GET /health
Returns service health for any microservice.

**Response:**
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "1.0.0"
}
```

---

## OpenAPI Specification

Full OpenAPI 3.0 spec available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Raw JSON:** `http://localhost:8000/openapi.json`

---

## Postman Collection

Import the collection from:
```
docs/api/TenderOS_v1.0.0.postman_collection.json
```

**Setup:**
1. Set `base_url` variable to `http://localhost:8000`
2. Run **Login** request to get access token
3. Token is automatically saved to `access_token` variable
4. All other requests use `{{access_token}}` automatically

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Not authenticated — token missing or expired |
| `403` | Not authorised — insufficient role/plan |
| `404` | Resource not found |
| `422` | Unprocessable entity — schema mismatch |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `503` | Service temporarily unavailable |

### Rate Limits

| Plan | Requests / Minute |
|------|------------------|
| Free (Viewer) | 10 |
| SME / MSME / Startup | 200 |
| Enterprise | 2,000 |
| API (Programmatic) | 10,000 |
