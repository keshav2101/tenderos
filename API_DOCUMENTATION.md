# TenderOS API Documentation — v1.0.0

Welcome to the TenderOS API reference. This document details the HTTP endpoints, authorization models, and sample payloads for the platform's microservices ecosystem.

---

## 1. Authentication & Base Configurations

### Base URL
* **Production**: `https://backend-production-4aa8.up.railway.app`
* **Local**: `http://localhost:8080` (or `http://localhost:18000`)

### Authentication Mechanism
All protected endpoints require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_access_token>
```
Tokens are JWTs signed using `HS256`.

---

## 2. Authentication Service

### 2.1 User Login
Authenticates a user and returns access/refresh tokens.

* **Endpoint**: `POST /api/v1/auth/login`
* **Authentication**: None (Public)
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "bid_manager"
    }
  }
  ```
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "detail": "Incorrect email or password"
  }
  ```

### 2.2 Refresh Token
Obtain a new access token using a valid refresh token.

* **Endpoint**: `POST /api/v1/auth/refresh`
* **Authentication**: None (Public)
* **Request Body**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

---

## 3. Tenders Service

### 3.1 List Tenders
Retrieve a paginated list of tenders filtered by Indian procurement parameters.

* **Endpoint**: `GET /api/v1/tenders`
* **Authentication**: None (Guest allowed, filters returned based on public fields)
* **Query Parameters**:
  - `page` (int, default: 1)
  - `page_size` (int, default: 20)
  - `ministry` (str, optional)
  - `state` (str, optional)
  - `msme_eligible` (bool, optional)
  - `cost_min` (float, in lakhs, optional)
  - `cost_max` (float, in lakhs, optional)
* **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "7ac1d234-8c88-4688-9277-ef56475657ef",
        "tender_id": "GeM/2026/B/876231",
        "title": "Supply and Commissioning of 3T MRI Machines",
        "ministry": "Ministry of Health and Family Welfare",
        "department": "AIIMS Delhi",
        "estimated_cost_lakhs": 450.00,
        "msme_eligible": true,
        "state": "Delhi",
        "published_date": "2026-07-10T10:00:00Z",
        "submission_deadline": "2026-08-10T15:00:00Z",
        "status": "active"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
  ```

### 3.2 Add to Watchlist
Add a specific tender to the user's active watchlist.

* **Endpoint**: `POST /api/v1/tenders/{id}/watchlist`
* **Authentication**: Required (Bearer Token)
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Tender added to watchlist",
    "watchlist_id": "987ba654-e89b-12d4-a716-446655440000"
  }
  ```
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "detail": "Could not validate credentials"
  }
  ```

---

## 4. Search Service

### 4.1 Hybrid Search
Perform keyword + vector semantic search with Reciprocal Rank Fusion (RRF).

* **Endpoint**: `GET /api/v1/search`
* **Authentication**: None (Public)
* **Query Parameters**:
  - `q` (str, required) — The search keyword query
  - `limit` (int, default: 10)
* **Response (200 OK)**:
  ```json
  {
    "query": "Solar rooftop installations",
    "results": [
      {
        "id": "c609066f-5db9-4309-98f2-5c7e516065cc",
        "title": "Grid Connected Rooftop Solar Power Plant for Government Schools",
        "ministry": "Ministry of Power",
        "score": 0.942,
        "match_type": "hybrid"
      }
    ]
  }
  ```

---

## 5. Analytics Service

### 5.1 Analytics Dashboard Overview
Retrieve aggregate metrics for active bids and win-rates.

* **Endpoint**: `GET /api/v1/analytics/overview`
* **Authentication**: Required (Bearer Token)
* **Response (200 OK)**:
  ```json
  {
    "total_bids_submitted": 42,
    "active_watchlist_count": 15,
    "win_ratio": 0.64,
    "total_value_lakhs": 2450.50,
    "ministry_distribution": {
      "Ministry of Defence": 12,
      "Ministry of Railways": 8,
      "Ministry of Health": 5
    }
  }
  ```

---

## 6. Copilot Service

### 6.1 Chat with Tender
Ask natural language questions about specific documents of a tender.

* **Endpoint**: `POST /api/v1/chat/{tender_id}`
* **Authentication**: Required (Bearer Token)
* **Request Body**:
  ```json
  {
    "message": "What is the EMD requirement and is there an exemption for MSMEs?"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "answer": "According to Section 4.2 of the bid document, the Earnest Money Deposit (EMD) is INR 5,00,000. However, Class-I and Class-II local suppliers registered under MSME/Udyam are fully exempt from submitting the EMD, provided they upload a valid registration certificate.",
    "citations": [
      {
        "page": 14,
        "text_snippet": "Earnest Money Deposit (EMD) shall be waived for all recognized Udyam MSME entities...",
        "document_name": "NIT_MRI_Delhi.pdf"
      }
    ]
  }
  ```

---

## 7. Proposal Service

### 7.1 Draft Technical Bid Proposal
Generate compliant Technical Proposal outlines using tender specifications.

* **Endpoint**: `POST /api/v1/proposals/generate`
* **Authentication**: Required (Bearer Token)
* **Request Body**:
  ```json
  {
    "tender_id": "7ac1d234-8c88-4688-9277-ef56475657ef",
    "company_id": "8b9ba654-e89b-12d4-a716-446655440000"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "proposal_id": "3cb40281-a90f-488b-a82f-e8b8c560c5ea",
    "status": "generated",
    "title": "Technical Bid Proposal - Supply of MRI Machines (AIIMS)",
    "sections": [
      {
        "heading": "1. Executive Summary & Solution Compliance",
        "content": "This proposal details our plan to supply State-of-the-art 3T MRI Machines..."
      },
      {
        "heading": "2. EMD and Bid Security Declaration",
        "content": "A valid Udyam Registration (UDYAM-DL-01-xxxx) has been attached to claim waiver..."
      }
    ]
  }
  ```

---

## 8. Admin Service

### 8.1 System Integration Health
Perform internal gateway deep check audits.

* **Endpoint**: `GET /api/v1/admin/health-check`
* **Authentication**: Required (Admin role verification)
* **Response (200 OK)**:
  ```json
  {
    "gateway_version": "1.0.0",
    "environment": "production",
    "memory_usage_mb": 142.35,
    "cpu_percent": 4.2,
    "active_threads": 12,
    "services": {
      "auth-service": "UP",
      "tender-service": "UP",
      "connector-service": "UP",
      "scheduler-service": "UP"
    }
  }
  ```
