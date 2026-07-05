# TenderOS v1.0.0 — User Guide

> **TenderOS** is an AI Procurement Decision Intelligence Platform for the Indian Government procurement ecosystem.
> The AI provides analysis, recommendations, and insights. **All final procurement decisions are made by you.**

---

## Quick Start

1. Open `http://localhost:3000` in your browser
2. Login with your assigned account
3. You will land on the **Dashboard**

---

## User Roles

| Role | What you can do |
|------|----------------|
| **Administrator** | Full platform control, user management, connector management |
| **Enterprise** | All bid features, team management, full analytics |
| **Consultant** | Tender discovery, analysis, proposal drafting, bid advice |
| **MSME / SME** | Tender discovery, AI qualification, bid workflows, MSME exemption tools |
| **Startup (DPIIT)** | Same as MSME, plus Startup relaxation eligibility checks |
| **Viewer** | Read-only access to tenders and analytics |

---

## 1. Administrator Guide

### Platform Management
- **Users**: Create/edit/disable user accounts at `/admin/users`
- **Connectors**: View GeM, CPPP, IREPS sync status at `/admin/connectors`
- **Audit Logs**: Review all AI interactions and human decisions at `/admin/audit`
- **AI Registry**: Monitor active LLM models and accuracy scores at `/admin/ai-registry`

### Connector Management
```
Dashboard → Admin → Connectors
  → GeM (refreshes every 20 min)
  → CPPP (refreshes every hour)
  → Maharashtra PWD (refreshes every 4 hours)
  → Indian Railways IREPS (refreshes every 6 hours)
```

Trigger a manual refresh:
```
Admin → Connectors → [Select portal] → Sync Now
```

### User Plan Management
Plans available: **Free**, **SME**, **Enterprise**, **API**
- Upgrade/downgrade via Admin panel or Stripe Billing
- Free plan: 10 API requests/minute, basic tender discovery
- SME plan: 200 requests/minute, AI qualification, bid workflows
- Enterprise plan: 2,000 requests/minute, full platform access

---

## 2. Enterprise Guide

### Tender Discovery
1. Go to **Dashboard → Tender Feed**
2. Use filters: State, Ministry, Category, Value range, MSME exemption
3. Click any tender card to view full details
4. **Watchlist**: Click ★ to add a tender to your watchlist

### AI Copilot (Procurement Intelligence)
On any tender detail page:
1. Click **Ask Copilot** tab
2. Type your question:
   - *"What is the EMD requirement and can we claim exemption?"*
   - *"What is the minimum turnover required and do we qualify?"*
   - *"What are the Make in India requirements for this tender?"*
   - *"List all the disqualification clauses."*
3. The Copilot responds with cited evidence from the tender document
4. **Review the response** — it is AI-generated analysis, not a legal opinion

### Bid Qualification Check
1. Open a tender → Click **Check Eligibility**
2. Select your company profile
3. Review the AI Go/No-Go report:
   - Match score (0–100)
   - Eligibility score
   - MSME/Startup exemption eligibility
   - Missing documents checklist
   - Key risks and advantages
4. **Approve or reject the recommendation** — the AI advises, you decide

### Bid Workflow
Once you decide to bid:
```
AI Recommendation → Technical Review → Finance Review 
  → Legal Review → Management Approval → Bid Submission
  → Track: Technical Evaluation → L1 Determination → LOA → Work Order → PBG Release
```
Each step requires explicit human approval before progressing.

### Analytics Dashboard
- **Ministry Spending**: Which ministries are spending in your sector
- **Category Trends**: Demand trends for your categories
- **State Volume**: Geographic procurement distribution
- **Win Rate**: Your historical bid success rate

---

## 3. MSME Guide

> TenderOS is specifically designed to help MSMEs leverage procurement exemptions.

### MSME Exemptions Automatically Applied
- ✅ **EMD Waiver**: EMD exemption automatically flagged for Udyam-registered companies
- ✅ **Purchase Preference**: 15% price preference for Class-I and Class-II local suppliers
- ✅ **Relaxed Criteria**: Experience and turnover criteria relaxed for MSME bidders

### Setup Your Company Profile
1. Go to **Company Profile** (top right → My Company)
2. Enter your **Udyam Registration Number** (UDYAM-XX-XX-XXXXXXX)
3. Upload **Udyam Registration Certificate**
4. Verify **GST Registration** (auto-validated)
5. Profile score increases with each verified document

### Finding MSME-Friendly Tenders
```
Tender Feed → Filters → "MSME Exemption Available" (toggle ON)
```
This shows tenders where your EMD is fully waived.

### Understanding Your Bid Qualification Report
- 🟢 **GO**: AI recommends bidding — strong eligibility match
- 🟡 **REVIEW**: Borderline — review the specific gaps
- 🔴 **NO-GO**: Missing critical requirements — AI explains why

> **Remember**: The AI recommendation is advisory. Your procurement manager makes the final call.

### Documents Typically Required
- Udyam Registration Certificate
- GST Registration Certificate
- PAN Card (Company)
- MSME Declaration (for EMD exemption)
- Prior Experience Certificates
- Financial Statements (last 3 years)
- ISO / Quality Certification (if required)

---

## 4. Startup Guide

> DPIIT-recognized startups receive maximum relaxations on Indian Government tenders.

### Startup Relaxations (Startup India Policy)
- ✅ **EMD fully waived** (for tenders up to specified threshold)
- ✅ **Prior experience criteria relaxed** (self-certification allowed)
- ✅ **Turnover criteria relaxed** (no minimum turnover for startups)
- ✅ **Make in India exemptions** in certain categories

### Setup Startup Profile
1. Go to **Company Profile → DPIIT Recognition**
2. Enter your **DPIIT Recognition Number** (DIPP-XXXXXX)
3. Upload **DPIIT Certificate** (with validity date)
4. Enter company founding date (must be < 10 years)

### EOI & Empanelment Opportunities
Use the filter: `Procurement Method = EOI` to find Expression of Interest tenders — these are ideal for startups entering government procurement.

### Karnataka EOI Example
The Karnataka KEONICS EOI (CPPP/2026/EOI/KA/334455) is pre-seeded in your demo. Open it to see how the AI Copilot analyzes your eligibility for empanelment.

---

## 5. Consultant Guide

### Working Across Multiple Clients
- As a Consultant, you can be associated with multiple companies
- Access: **Dashboard → My Clients** to switch client context
- Each client's data is isolated by tenant

### Proposal Drafting
1. Select a tender + client company
2. Run Bid Qualification check
3. Go to **Proposals → Generate Draft**
4. The AI assembles:
   - Compliance checklist
   - Technical proposal outline
   - Risk assessment
   - Document checklist
5. **Review and edit the draft** — AI output is a starting point, not a final submission

### Workflow Management
Monitor and advance client bid workflows:
```
Dashboard → Workflows → [Select client tender]
  → Advance to next stage (with your approval)
  → Add comments/notes at each stage
```

### Knowledge Graph Insights
- **Market Intelligence**: Which companies typically win in a sector
- **Department Relationships**: Identify key buying departments
- **Award History**: Historical L1 prices for benchmarking

---

## 6. Common Workflows

### Finding a Tender and Running End-to-End Analysis
```
1. Dashboard → Search: "AI surveillance Delhi 500 crore"
2. Click on GeM tender result
3. View tender details: EMD, deadline, categories
4. Click "Check Eligibility" → Run AI qualification
5. Review: Score 78/100, DPIIT exemption applies
6. Click "Ask Copilot" → "What technical documents are required?"
7. Review Copilot response (AI analysis, not legal advice)
8. Decision: GO → Add to watchlist
9. Proposal → Generate Draft → Review → Submit
10. Workflow: Track through evaluation → L1 → LOA
```

### Monitoring Deadline Reminders
- All watched tenders send email reminders at:
  - 7 days before deadline
  - 3 days before deadline
  - 24 hours before deadline
- Configure at **Profile → Notification Preferences**

---

## 7. AI Disclaimer

> **TenderOS AI Policy**: TenderOS is an AI Procurement *Decision Intelligence* Platform, not an autonomous procurement platform.
>
> The AI:
> - ✅ Analyzes tenders and eligibility
> - ✅ Recommends Go/No-Go with evidence
> - ✅ Identifies risks and missing documents
> - ✅ Generates proposal drafts for human review
> - ✅ Cites specific clauses and regulations
>
> The AI does NOT:
> - ❌ Make the final bid/no-bid decision
> - ❌ Submit bids autonomously
> - ❌ Sign contracts or LOAs
> - ❌ Override human approval steps
>
> All AI outputs are clearly labeled as recommendations. Every AI interaction is logged in the audit trail.

---

## Support

- **Platform issues**: Contact your System Administrator
- **Technical API queries**: `docs/api/API_REFERENCE.md`
- **Architecture questions**: `docs/architecture/ARCHITECTURE.md`
- **Deployment issues**: `docs/deployment/DEPLOYMENT_GUIDE.md`
