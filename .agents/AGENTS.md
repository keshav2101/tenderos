# India-First Procurement Operating System Guidelines

Every architectural decision, database schema, AI workflow, recommendation engine, UI, APIs, connectors, analytics and business logic must be designed specifically for the Indian Government Procurement Ecosystem.

---

## 1. Indian Government Procurement Portals
Prioritize deep modeling, schemas, and connectors for:
- **Government e-Marketplace (GeM)**
- **Central Public Procurement Portal (CPPP)**
- **Indian Railways (IREPS)**
- **Defence (DRDO, HAL, BEL, Indian Army/Navy/AirForce)**
- **PSUs (ONGC, BHEL, NTPC, IOCL, etc.)**
- **State eProcurement Portals** (e.g. Maharashtra, Karnataka, Uttar Pradesh PWD)
- **Municipal Corporations & Autonomous Bodies** (e.g. AIIMS, IITs)

---

## 2. Procurement Ontology & Terminology
All services must natively process and represent:
- **EMD (Earnest Money Deposit)** & **EMD Exemption** (Udyam/MSME rules)
- **Tender Fee** & **Performance Security** / **PBG (Performance Bank Guarantee)**
- **BOQ (Bill of Quantities)** & **NIT (Notice Inviting Tender)**
- **LOA (Letter of Acceptance)** & **LOI (Letter of Intent)**
- **MSME & Udyam Benefits** (15% purchase preference, EMD waiver)
- **Startup India Relaxations** (exemption from prior turnover and experience criteria)
- **Make in India (MII) Compliance** (Class-I / Class-II Local Supplier preference, GFR 2017 Rule 144(xi))
- **L1 (Lowest Bidder)** & **QCBS (Quality and Cost Based Selection)** evaluation systems
- **CPWD (Central Public Works Department) norms** & **CVC (Central Vigilance Commission) Guidelines**

---

## 3. Company Digital Twin Compliance Checks
Model Indian organizations based on valid:
- **GST (Goods and Services Tax)** registration
- **PAN (Permanent Account Number)** & **CIN (Corporate Identification Number)**
- **Udyam MSME Registration** & **DPIIT Startup Recognition**
- **GeM Seller ID** & **NSIC Registration**
- **DSC (Digital Signature Certificate)** availability
- **PF (Provident Fund)** & **ESIC (Employees' State Insurance)** registrations

---

## 4. Lifecycle Stages
Track the bid progression through these specific Indian government milestones:
1. `TENDER_PUBLISHED`
2. `CORRIGENDUM_ISSUED`
3. `PRE_BID_MEETING`
4. `CLARIFICATIONS`
5. `TECHNICAL_BID_SUBMITTED`
6. `TECHNICAL_EVALUATION`
7. `FINANCIAL_BID_OPENED`
8. `L1_DETERMINED`
9. `AWARD_LOA`
10. `AGREEMENT_SIGNED`
11. `WORK_ORDER_ISSUED`
12. `EXECUTION`
13. `INVOICE_SUBMITTED`
14. `PAYMENT_RELEASED`
15. `COMPLETION_CERTIFICATE`
16. `PBG_RELEASE`

---

## 5. Development Principles
Before implementing any feature, verify:
- *"How would an Indian Government procurement officer, PSU, MSME, Startup, EPC contractor, OEM, or System Integrator use this?"*
- Never implement generic global procurement schemas. Optimize purely for the depth of India's ecosystem.
