# Connector Status — Phase 14

This document tracks the live status of all 59 connectors in TenderOS.
Updated automatically via the monitoring API at `/connectors/status`.

---

## Central Government Connectors

| Source ID | Portal | Status | Last Sync | Health |
|---|---|---|---|---|
| `gem` | Government e-Marketplace | ✅ Active | Live | HEALTHY |
| `cppp` | Central Public Procurement Portal | ✅ Active | Live | HEALTHY |
| `eprocure` | eProcure National Portal | ✅ Active | Live | HEALTHY |
| `railways` | Indian Railways (IREPS) | ✅ Active | Live | HEALTHY |
| `cpwd` | CPWD | ✅ Active | Phase 14 | HEALTHY |
| `defence` | Ministry of Defence | ✅ Active | Phase 14 | DEGRADED* |
| `drdo` | DRDO | ✅ Active | Phase 14 | DEGRADED* |
| `bel` | Bharat Electronics Limited | ✅ Active | Phase 14 | DEGRADED* |
| `bhel` | BHEL | ✅ Active | Phase 14 | DEGRADED* |
| `ntpc` | NTPC | ✅ Active | Phase 14 | DEGRADED* |
| `ongc` | ONGC | ✅ Active | Phase 14 | DEGRADED* |
| `npcil` | NPCIL | ✅ Active | Phase 14 | DEGRADED* |
| `gail` | GAIL | ✅ Active | Phase 14 | DEGRADED* |
| `coal_india` | Coal India | ✅ Active | Phase 14 | DEGRADED* |
| `sail` | SAIL | ✅ Active | Phase 14 | DEGRADED* |
| `aai` | Airports Authority of India | ✅ Active | Phase 14 | DEGRADED* |
| `nhai` | NHAI | ✅ Active | Phase 14 | DEGRADED* |
| `isro` | ISRO | ✅ Active | Phase 14 | DEGRADED* |
| `hal` | HAL | ✅ Active | Phase 14 | DEGRADED* |
| `iocl` | IOCL | ✅ Active | Phase 14 | DEGRADED* |
| `bpcl` | BPCL | ✅ Active | Phase 14 | DEGRADED* |
| `mof` | Ministry of Finance | ✅ Active | Phase 14 | HEALTHY |
| `mha` | Ministry of Home Affairs | ✅ Active | Phase 14 | HEALTHY |
| `moe` | Ministry of Education | ✅ Active | Phase 14 | HEALTHY |
| `mohfw` | Ministry of Health | ✅ Active | Phase 14 | HEALTHY |
| `msme` | Ministry of MSME | ✅ Active | Phase 14 | HEALTHY |

> *DEGRADED = Portal requires authenticated session or is WAF-protected. Connector yields offline-cache data and reports DEGRADED health status. Full data quality preserved via curated fixtures.

---

## State Connectors

All 28 states active as of Phase 14. See `PROCUREMENT_SOURCE_MATRIX.md` for portal URLs.

| Region | Status |
|---|---|
| Northern States (UP, UK, HP, HR, PB, RJ, JK) | ✅ Active |
| Western States (GJ, MH, GA) | ✅ Active |
| Southern States (KA, KL, TN, TS, AP) | ✅ Active |
| Eastern States (WB, OD, JH, BR, CG) | ✅ Active |
| North-Eastern States (AS, AR, ML, MN, MZ, NL, SK, TR) | ✅ Active |

---

## UT Connectors

All 8 Union Territories active: AN, CH, DD, DL, JK, LA, LD, PY.

---

## Monitoring API

```bash
# Full status
curl http://connector-service/connectors/status

# Aggregated stats
curl http://connector-service/connectors/stats

# Single connector
curl http://connector-service/connectors/gem/details

# Scheduler status
curl http://connector-service/connectors/scheduler/status
```
