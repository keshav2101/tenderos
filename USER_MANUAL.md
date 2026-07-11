# User Manual — TenderOS v1.0.0

This manual guides end-users through the primary functionalities of the TenderOS platform, including portal authentication, search pipelines, watchlist management, and AI bid response formulation.

---

## 1. Getting Started: Registration & Login

To start using TenderOS, users must log in to their assigned enterprise space:

1. Open your browser and navigate to the frontend interface (e.g. `http://localhost:3000` or the hosted deployment link).
2. You will be redirected to the `/login` screen.
3. Enter your corporate email and password.
4. Click **Sign In**.
5. Once authenticated, the system saves your secure session token (JWT) and directs you to the main dashboard workspace.

---

## 2. Platform Dashboard

The landing dashboard displays aggregate procurement statistics, recent notifications, and active watchlists:

- **Quick Stats**: Review total submitted bids, active search watchlists, win ratios, and cumulative contract values.
- **Tender Feed**: Displays a live list of matching tenders published by the Indian Government on CPPP, GeM, Railways, and state PWD portals.
- **Quick Links**: Access the AI Copilot chat pane, Proposal generation suite, and company registration files from the sidebar navigation.

---

## 3. Searching and Sorting Tenders

TenderOS uses a hybrid search engine to find government contracts:

1. Click on the **Search** input box on the top navbar.
2. Enter your keyword search terms (e.g., *"Solar school rooftop installation"* or *"MRI Machines AIIMS"*).
3. The results will load in real-time, sorted by match relevance (using BM25 keyword matching + vector semantic embeddings).
4. Refine search results using the sidebar filters:
   - **State / Location** (e.g., Maharashtra, Delhi)
   - **Ministry / Department** (e.g., Ministry of Defence)
   - **Value range (Lakhs)**
   - **MSME Eligibility Waiver** (Yes/No)

---

## 4. Viewing Tender Details & Watchlist

1. From the search results or dashboard list, click on any tender card.
2. The **Tender Detail Page** opens, displaying:
   - Notice Inviting Tender (NIT) metadata.
   - Earnest Money Deposit (EMD) and tender fee details.
   - Exemption eligibility checks (MSME preference, Make in India local content tier).
   - Direct download links for critical PDF bid documents.
3. Click **Add to Watchlist** on the top right to bookmark the tender. You will receive email alerts if any corrigendum is published by the portal.

---

## 5. Generating AI Bid Proposals

TenderOS saves you hundreds of manual writing hours by drafting structured, compliant technical bid drafts:

1. Navigate to the **Proposal Generator** page or click **Draft Proposal** on an active tender.
2. Select your target tender and your company profile.
3. Click **Generate Technical Bid**.
4. The backend service will read the tender specifications, compare them with your company's credentials (GST, turnover, experience), apply MSME/Startup GFR waivers, and produce a formatted **Technical Proposal Outline**:
   - **Section 1**: Compliance Matrix.
   - **Section 2**: Technical Solution Architecture.
   - **Section 3**: Eligibility Declarations (EMD waiver proof, ISO certificates).
5. Click **Download PDF / DOCX** to export the document for final review and digital signing.

---

## 6. Company Digital Twin Profile

Your company's documents and certifications are stored securely in your profile:

- **Registrations**: Input and verify your GSTIN, PAN, and Udyam Registration number.
- **Turnovers**: Upload certified financial ledger sheets to verify your capability for large tenders.
- **Experience**: Log past work experience contracts and completion certificates to automatically pass minimum qualification rules.
- **Certificates**: Track ISO audits, Startup India recognition letters, and local supplier declarations.
