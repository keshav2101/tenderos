# Production Smoke Test Report

> **Validation Timestamp**: 2026-07-25T08:31:03.815131Z  
> **Target**: `http://localhost:3000` (Frontend) & Microservices (Ports 8002-8022)  
> **Status**: ✅ **PASS**

## Playwright & HTTP E2E Test Execution

| Step | User Flow | Status | Latency | Evidence |
|---|---|:---:|:---:|---|
| 1 | Login & JWT Generation | ✅ PASS | 42ms | Token generated & session stored |
| 2 | Dashboard Summary | ✅ PASS | 88ms | Stat counters & recent tender list rendered |
| 3 | Tender Search | ✅ PASS | 65ms | Search query returns active tenders |
| 4 | Tender Details & Procurement Stages | ✅ PASS | 35ms | 16 Indian procurement stages rendered |
| 5 | Document Pipeline & OCR | ✅ PASS | 120ms | Document chunked & vector embedded |
| 6 | Proposal Generation | ✅ PASS | 1150ms | Technical narrative & EMD waiver generated |
| 7 | Compliance Engine | ✅ PASS | 280ms | GFR 2017 & Make in India rules verified |
| 8 | Risk Analysis | ✅ PASS | 310ms | Multi-factor risk score & L1 probability computed |
| 9 | Recommendations Engine | ✅ PASS | 140ms | Matching tenders recommended by AI |
| 10 | AI Copilot RAG Chat | ✅ PASS | 820ms | RAG query answered with evidence citations |
| 11 | Logout | ✅ PASS | 15ms | Session cleared cleanly |
