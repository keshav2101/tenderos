# Phase 0 — Risk Register

The following risks are logged for TenderOS v1.0.0 based on our Phase 0 baseline verification sweep:

---

| ID | Category | Severity | Description | Impact | Recommended Action | Status |
|---|---|---|---|---|---|---|
| **RSK-01** | Infrastructure | **HIGH** | eProcurement Portals (GeM/CPPP) implement geoblocks and IP rate limits. | 147/205 connectors return `BLOCKED_WAF` or network timeouts. | Integrate residential proxy rotation pools in `connector-service`. | **OPEN** |
| **RSK-02** | Security | **MEDIUM** | JWT secrets use default template values in local compose configurations. | Potential compromise if dev compose configuration is exposed. | Enforce dynamic production env variable injection on Railway/Vercel. | **MITIGATED** |
| **RSK-03** | Third-Party API | **MEDIUM** | Stripe, Twilio, and SMTP configurations fallback to mock print logs if keys are missing. | Payment and email workflows will fail in real staging/production. | Provision live SMS and payment tokens before public launch. | **OPEN** |
| **RSK-04** | Performance | **LOW** | OpenSearch trigram index queries can experience scaling lag as records exceed 100k. | Slow search latency (~1,200 ms currently). | Configure composite indexes and optimize BM25 search weights. | **OPEN** |
| **RSK-05** | Development | **LOW** | Submodule references require explicit manual updates in the root repository. | Frontend and backend changes can drift out of sync if not staged. | Enforce CI/CD pipeline git checks to prevent mismatch commits. | **OPEN** |
