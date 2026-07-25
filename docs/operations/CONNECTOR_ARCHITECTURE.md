# TenderOS Connector Architecture — Phase 14

## Overview

The TenderOS connector ecosystem is a modular, plugin-based data ingestion framework that aggregates procurement notices from 80+ Indian government portals — covering Central Government ministries, PSUs, defence organisations, and all 36 State/Union Territory procurement portals.

---

## Directory Structure

```
services/connector-service/
├── app/
│   ├── main.py                    # FastAPI app + 10 monitoring endpoints
│   ├── scheduler.py               # APScheduler cron engine
│   ├── queue.py                   # Redis event queue
│   ├── config.py                  # Service configuration
│   └── connectors/
│       ├── base.py                # BaseConnector + ConnectorState
│       ├── normalization.py       # Unified TenderOS schema normalization
│       ├── validation.py          # Business rule validation + DLQ
│       ├── quality_engine.py      # 0-100 quality scoring + dedup
│       ├── incremental.py         # Delta crawling + Redis checkpoints
│       ├── registry.py            # Auto-discovery registry
│       └── plugins/
│           ├── gem_connector.py   # GeM (Elasticsearch API)
│           ├── cppp_connector.py  # CPPP (RSS + HTML)
│           ├── railways_connector.py
│           ├── psu_connector.py   # Legacy PSU (deprecated)
│           ├── state_procurement_connector.py # Legacy
│           ├── central_gov/
│           │   ├── eprocure_connector.py
│           │   ├── ministry_base.py       # MinistryBaseConnector
│           │   ├── ministry_connectors.py # CPWD, Defence, DRDO, BEL, MoF, MHA, MoE, MoHFW, MSME
│           │   └── psu_connectors.py      # BHEL, NTPC, ONGC, NPCIL, GAIL, Coal India, SAIL, AAI, NHAI, ISRO, HAL, IOCL, BPCL
│           └── state/
│               ├── state_base.py          # StateBaseConnector
│               └── state_connectors.py    # All 36 State/UT connectors
└── tests/
    └── test_connector_framework.py
```

---

## Ingestion Pipeline

```
                        FETCH
                   (BaseConnector.fetch_tenders)
                           │
                           ▼
                      NORMALIZE
                   (normalization.py)
                           │
                           ▼
                    QUALITY SCORE
                   (quality_engine.py)
                   ≥30/100 to proceed
                           │
                           ▼
                      VALIDATE
                   (validation.py)
                   Required fields, dates, URLs
                           │
                      ┌────┴────┐
                      │        │
                    QUEUE    FALLBACK
                  (Redis)     (PostgreSQL direct)
                      │        │
                      └────┬───┘
                           │
                       INDEXED
               (OpenSearch + Qdrant vectors)
```

---

## Connector Classes

| Layer | Class | Responsibility |
|---|---|---|
| Abstract | `BaseConnector` | Interface contract, state tracking, logging |
| Central | `MinistryBaseConnector` | Ministry-filtered CPPP notices |
| PSU | `PSUBaseConnector` | WAF-aware PSU portal access with offline cache |
| State | `StateBaseConnector` | Login-gate detection + per-state fixture data |
| Individual | 80+ plugin classes | Source-specific parsing |

---

## Connector Lifecycle

```
IDLE → [Scheduler triggers] → RUNNING → [SUCCESS] → IDLE
                                      → [FAILURE] → IDLE (with backoff)
```

State is tracked in `ConnectorState` (in-memory) and mirrored to Redis as `connector_status:{source_id}` hash.

---

## Anti-Bot Policy

Many Indian government portals are protected by:
- NIC OTP login walls
- Cloudflare WAF (403/captcha)
- IP-based rate limiting
- Session-required pagination

**Policy**: Connectors attempt live access first. If blocked (detected via `captcha`/`login`/`otp` in response body or 403 status), they:
1. Log the access limitation clearly (`access_limitations` field)
2. Fall back to curated, schema-compliant offline cache data
3. Return `HealthStatus.DEGRADED` on health checks

This ensures the pipeline stays functional while being honest about data provenance via `lineage.original_source_portal`.
