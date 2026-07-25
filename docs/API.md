# TenderOS API Reference

TenderOS exposes RESTful APIs via FastAPI microservices.

## Authentication

All protected endpoints require a Bearer JWT Token in the HTTP Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## Microservice Endpoints Overview

| Service | Port | Endpoint | Description |
|---|---|---|---|
| Tender Service | 8002 | `GET /api/v1/tenders` | Search and filter tenders |
| Tender Service | 8002 | `GET /api/v1/tenders/{id}` | Tender details & procurement stage |
| Copilot Service | 8011 | `POST /api/v1/copilot/chat` | RAG-grounded AI Copilot chat |
| Proposal Service | 8017 | `POST /api/v1/proposals/generate` | Generate tender bid proposal |
| Knowledge Graph | 8009 | `GET /api/v1/graph/suppliers` | Supplier relationship intelligence |
| Market Intelligence | 8014 | `GET /api/v1/market/forecast` | L1 prediction & win probability |
| Connector Service | 8003 | `GET /api/v1/connectors/status` | Real-time status of 205 scrapers |
| Governance Service | 8021 | `GET /api/v1/governance/audit-logs` | Audit trail & RBAC policy |

## Common Status Codes

- `200 OK`: Request succeeded.
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Insufficient RBAC permissions.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled backend error.
