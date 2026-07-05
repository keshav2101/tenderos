-- TenderOS PostgreSQL Schema
-- Run automatically via docker-entrypoint-initdb.d

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For trigram text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For array indexes

-- ─────────────────────────────────────────────────────────────
-- USERS & AUTH
-- ─────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'enterprise', 'sme', 'consultant', 'viewer');
CREATE TYPE user_plan AS ENUM ('free', 'sme', 'enterprise', 'api');

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain          VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    logo_url        TEXT,
    theme_colors    JSONB DEFAULT '{"primary": "#6172f3", "secondary": "#0f0f1a"}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_sso_configs (
    tenant_id       UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    provider_type   VARCHAR(50) NOT NULL,
    entity_id       TEXT NOT NULL,
    sso_url         TEXT NOT NULL,
    x509_certificate TEXT NOT NULL,
    metadata_xml    TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255),
    password_hash   VARCHAR(255),
    role            user_role NOT NULL DEFAULT 'viewer',
    plan            user_plan NOT NULL DEFAULT 'free',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    google_id       VARCHAR(255) UNIQUE,
    microsoft_id    VARCHAR(255) UNIQUE,
    company_id      UUID,
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan_status     VARCHAR(50) DEFAULT 'active',
    subscription_ends_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE api_keys (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    key_prefix  VARCHAR(16) NOT NULL,
    key_hash    VARCHAR(255) NOT NULL,
    plan        user_plan NOT NULL DEFAULT 'sme',
    daily_limit INT NOT NULL DEFAULT 10000,
    usage_today INT NOT NULL DEFAULT 0,
    usage_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- TENDERS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE tender_status AS ENUM ('active', 'closed', 'awarded', 'cancelled', 'corrigendum', 'upcoming');
CREATE TYPE procurement_method AS ENUM ('open', 'limited', 'single', 'emergency', 'gem', 'e-tendering', 'rate_contract', 'eoi');
CREATE TYPE extraction_tier AS ENUM ('1', '2', '3');

CREATE TABLE tenders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source tracking
    source                  VARCHAR(64) NOT NULL,     -- gem | cppp | maharashtra | etc.
    source_tender_id        VARCHAR(255) NOT NULL,
    source_url              TEXT,
    version                 INT NOT NULL DEFAULT 1,
    dedup_hash              VARCHAR(64),              -- SHA256 for deduplication

    -- Core identity
    title                   TEXT NOT NULL,
    ministry                VARCHAR(255),
    department              VARCHAR(255),
    organisation            VARCHAR(255),
    organisation_type       VARCHAR(64),              -- PSU | Govt | Smart City

    -- Geography
    state                   VARCHAR(64),
    district                VARCHAR(64),
    location                TEXT,

    -- Financial (stored in Lakhs INR)
    estimated_cost_lakhs    DECIMAL(15,2),
    emd_lakhs               DECIMAL(12,2),
    tender_fee              DECIMAL(10,2),
    performance_guarantee_pct DECIMAL(5,2),

    -- Classification
    categories              TEXT[] DEFAULT '{}',
    procurement_method      procurement_method,
    status                  tender_status NOT NULL DEFAULT 'active',

    -- Timeline
    published_at            TIMESTAMPTZ,
    doc_download_start      TIMESTAMPTZ,
    doc_download_end        TIMESTAMPTZ,
    bid_submission_start    TIMESTAMPTZ,
    submission_deadline     TIMESTAMPTZ,
    opening_date            TIMESTAMPTZ,
    bid_validity_days       INT,
    work_completion_days    INT,

    -- Eligibility (denormalized for fast querying)
    turnover_min_lakhs      DECIMAL(12,2),
    experience_years        INT,
    certifications_required TEXT[] DEFAULT '{}',
    registrations_required  TEXT[] DEFAULT '{}',
    msme_eligible           BOOLEAN NOT NULL DEFAULT FALSE,
    startup_eligible        BOOLEAN NOT NULL DEFAULT FALSE,
    gem_registered_required BOOLEAN NOT NULL DEFAULT FALSE,
    eligibility_raw_text    TEXT,

    -- BOQ / Items count
    boq_item_count          INT DEFAULT 0,

    -- Contact
    contact_name            VARCHAR(255),
    contact_email           VARCHAR(255),
    contact_phone           VARCHAR(64),

    -- Documents
    corrigendum_count       INT NOT NULL DEFAULT 0,

    -- AI Extraction
    extraction_tier         INT NOT NULL DEFAULT 1,
    extraction_confidence   DECIMAL(4,3) NOT NULL DEFAULT 0,
    ai_summary              TEXT,
    key_points              TEXT[] DEFAULT '{}',
    embedding_id            VARCHAR(255),     -- Qdrant point ID

    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at          TIMESTAMPTZ,

    UNIQUE(source, source_tender_id)
);

-- Performance indexes
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_ministry ON tenders(ministry);
CREATE INDEX idx_tenders_department ON tenders(department);
CREATE INDEX idx_tenders_state ON tenders(state);
CREATE INDEX idx_tenders_deadline ON tenders(submission_deadline);
CREATE INDEX idx_tenders_cost ON tenders(estimated_cost_lakhs);
CREATE INDEX idx_tenders_categories ON tenders USING GIN(categories);
CREATE INDEX idx_tenders_source ON tenders(source);
CREATE INDEX idx_tenders_published ON tenders(published_at DESC);
CREATE INDEX idx_tenders_msme ON tenders(msme_eligible) WHERE msme_eligible = TRUE;
CREATE INDEX idx_tenders_title_trgm ON tenders USING GIN(title gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
-- TENDER DOCUMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE doc_type AS ENUM ('notice', 'corrigendum', 'boq', 'annexure', 'technical_spec', 'financial', 'nit', 'tender_form', 'other');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'done', 'failed');

CREATE TABLE tender_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id           UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    doc_type            doc_type NOT NULL DEFAULT 'other',
    filename            VARCHAR(500) NOT NULL,
    storage_path        TEXT NOT NULL,              -- MinIO path
    source_url          TEXT,
    file_hash           VARCHAR(64),               -- SHA256 for deduplication
    file_size_bytes     BIGINT,
    page_count          INT,

    -- OCR / extraction status (original fields)
    ocr_status          processing_status NOT NULL DEFAULT 'pending',
    layout_status       processing_status NOT NULL DEFAULT 'pending',
    extraction_status   processing_status NOT NULL DEFAULT 'pending',
    ocr_text_path       TEXT,                      -- MinIO path to OCR text
    layout_json_path    TEXT,                      -- MinIO path to layout JSON

    -- Document pipeline state machine tracking
    -- These were previously added at runtime via ALTER TABLE ADD COLUMN IF NOT EXISTS
    -- in document-pipeline/app/main.py startup. Defining them here removes that
    -- dependency and makes the schema authoritative.
    document_status         VARCHAR(50)     DEFAULT 'QUEUED',
    current_state           VARCHAR(50)     DEFAULT 'QUEUED',
    embedding_status        VARCHAR(50)     DEFAULT 'pending',
    last_processed          TIMESTAMPTZ,
    processing_errors       TEXT,
    failure_reason          TEXT,
    last_successful_stage   VARCHAR(100),
    retry_count             INT             DEFAULT 0,
    processing_duration_ms  INT,
    ocr_confidence_score    FLOAT,
    embedding_model_version VARCHAR(100),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_tender      ON tender_documents(tender_id);
CREATE INDEX idx_docs_status      ON tender_documents(ocr_status, extraction_status);
CREATE INDEX idx_docs_doc_status  ON tender_documents(document_status);
CREATE INDEX idx_docs_state       ON tender_documents(current_state);

-- ─────────────────────────────────────────────────────────────
-- TENDER VERSIONS + CORRIGENDA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE tender_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id       UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    version         INT NOT NULL,
    changed_fields  JSONB NOT NULL DEFAULT '[]',
    snapshot        JSONB,                         -- Full tender snapshot at this version
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source          VARCHAR(64)
);

CREATE INDEX idx_versions_tender ON tender_versions(tender_id, version DESC);

CREATE TABLE corrigenda (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id       UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    published_at    TIMESTAMPTZ,
    summary         TEXT,
    changed_fields  TEXT[] DEFAULT '{}',
    documents       TEXT[] DEFAULT '{}',           -- storage paths
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_corrigenda_tender ON corrigenda(tender_id);

-- ─────────────────────────────────────────────────────────────
-- AWARD RECORDS (Public procurement results)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE award_records (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id               UUID REFERENCES tenders(id) ON DELETE SET NULL,
    tender_source_id        VARCHAR(255),           -- In case tender is not in our DB
    ministry                VARCHAR(255),
    department              VARCHAR(255),
    category                TEXT[] DEFAULT '{}',
    winner_name             VARCHAR(500),
    winner_gstin            VARCHAR(20),
    winner_gem_id           VARCHAR(100),
    awarded_amount_lakhs    DECIMAL(15,2),
    estimated_amount_lakhs  DECIMAL(15,2),
    discount_pct            DECIMAL(5,2),
    awarded_at              DATE,
    source                  VARCHAR(255) NOT NULL DEFAULT 'public',
    source_url              TEXT,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_awards_tender ON award_records(tender_id);
CREATE INDEX idx_awards_winner ON award_records(winner_name);
CREATE INDEX idx_awards_ministry ON award_records(ministry);
CREATE INDEX idx_awards_category ON award_records USING GIN(category);
CREATE INDEX idx_awards_date ON award_records(awarded_at DESC);

-- ─────────────────────────────────────────────────────────────
-- COMPANIES (Digital Twin)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE entity_type AS ENUM ('MSME_Micro', 'MSME_Small', 'MSME_Medium', 'Startup', 'Large', 'MNC', 'NGO', 'Academic', 'PSU');

CREATE TABLE companies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    legal_name          VARCHAR(500) NOT NULL,
    trade_name          VARCHAR(500),
    gstin               VARCHAR(20) UNIQUE,
    pan                 VARCHAR(15),
    cin                 VARCHAR(25),
    entity_type         entity_type,
    employees           INT,
    founded_year        INT,
    registered_address  TEXT,
    states_active       TEXT[] DEFAULT '{}',
    cities_active       TEXT[] DEFAULT '{}',
    products_services   TEXT[] DEFAULT '{}',
    target_categories   TEXT[] DEFAULT '{}',
    primary_domain      VARCHAR(255),
    profile_score       DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    embedding_id        VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_user ON companies(user_id);
CREATE INDEX idx_companies_gstin ON companies(gstin);
CREATE INDEX idx_companies_categories ON companies USING GIN(target_categories);

CREATE TABLE company_turnover (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year            INT NOT NULL,                  -- Financial year end
    value_lakhs     DECIMAL(15,2) NOT NULL,
    auditor_name    VARCHAR(255),
    certificate_path TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    UNIQUE(company_id, year)
);

CREATE TABLE company_experience (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_name         VARCHAR(500) NOT NULL,
    project_name        VARCHAR(500),
    value_lakhs         DECIMAL(15,2),
    domain              VARCHAR(255),
    start_date          DATE,
    end_date            DATE,
    is_government       BOOLEAN NOT NULL DEFAULT FALSE,
    certificate_path    TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exp_company ON company_experience(company_id);

CREATE TABLE company_certifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    standard            VARCHAR(255) NOT NULL,
    scope               TEXT,
    certifying_body     VARCHAR(255),
    valid_from          DATE,
    valid_until         DATE,
    certificate_path    TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
);

CREATE TABLE company_registrations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    registration_type   VARCHAR(255) NOT NULL,
    registration_number VARCHAR(255) NOT NULL,
    valid_until         DATE,
    certificate_path    TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
);

-- ─────────────────────────────────────────────────────────────
-- COMPANY DOCUMENTS
-- Stores uploaded compliance and eligibility documents for the
-- Digital Twin (GST certificates, ISO certs, Udyam / MSME, PAN,
-- experience certificates, turnover certificates, etc.).
-- Referenced by: digital-twin-service /documents endpoints.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE company_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Ownership — supports both user-level and company-level access
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- File identity
    name                VARCHAR(500) NOT NULL,          -- original filename shown in UI
    type                VARCHAR(100) NOT NULL,          -- gst | msme | iso | pan | experience | turnover | other
    storage_path        TEXT,                           -- MinIO object path (nullable until uploaded)
    mime_type           VARCHAR(100),
    file_size_bytes     BIGINT,
    checksum_sha256     VARCHAR(64),                   -- deduplication + integrity check

    -- Verification lifecycle
    verified            BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | verified | rejected
    extracted_metadata  JSONB DEFAULT '{}',            -- AI-extracted fields (GSTIN, udyam_no, valid_until …)
    rejection_reason    TEXT,

    -- Timestamps
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_docs_user      ON company_documents(user_id);
CREATE INDEX idx_company_docs_company   ON company_documents(company_id);
CREATE INDEX idx_company_docs_type      ON company_documents(type);
CREATE INDEX idx_company_docs_verified  ON company_documents(verification_status);
CREATE INDEX idx_company_docs_checksum  ON company_documents(checksum_sha256)
    WHERE checksum_sha256 IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- BID QUALIFICATIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE bid_qualifications (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tender_id               UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    match_score             INT NOT NULL DEFAULT 0,
    eligibility_score       INT NOT NULL DEFAULT 0,
    winning_probability     INT,
    confidence              VARCHAR(10) NOT NULL DEFAULT 'LOW',
    eligible                BOOLEAN NOT NULL DEFAULT FALSE,
    recommendation          VARCHAR(30) NOT NULL DEFAULT 'REVIEW',
    recommendation_reason   TEXT,
    estimated_prep_hours    INT,
    missing_documents       TEXT[] DEFAULT '{}',
    gaps_json               JSONB DEFAULT '{}',
    key_risks               TEXT[] DEFAULT '{}',
    advantages              TEXT[] DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, tender_id)
);

CREATE INDEX idx_qualifications_company ON bid_qualifications(company_id);
CREATE INDEX idx_qualifications_tender ON bid_qualifications(tender_id);
CREATE INDEX idx_qualifications_score ON bid_qualifications(match_score DESC);

-- ─────────────────────────────────────────────────────────────
-- USER ENGAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE watchlists (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tender_id   UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tender_id)
);

CREATE TABLE saved_searches (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255),
    query       TEXT NOT NULL,
    filters     JSONB NOT NULL DEFAULT '{}',
    notify      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM ('new_tender', 'deadline_reminder', 'corrigendum', 'match', 'system');
CREATE TYPE notification_channel AS ENUM ('email', 'webhook', 'in_app');

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    channel         notification_channel NOT NULL DEFAULT 'in_app',
    title           VARCHAR(500) NOT NULL,
    body            TEXT,
    metadata        JSONB DEFAULT '{}',
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE notification_preferences (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    slack_webhook_url TEXT,
    webhook_url     TEXT,
    new_tender      BOOLEAN NOT NULL DEFAULT TRUE,
    deadline_days   INT[] DEFAULT '{3, 7}',
    corrigendum     BOOLEAN NOT NULL DEFAULT TRUE,
    match_threshold INT NOT NULL DEFAULT 70
);

-- ─────────────────────────────────────────────────────────────
-- CONNECTORS & SYNC TRACKING
-- ─────────────────────────────────────────────────────────────

CREATE TYPE connector_health AS ENUM ('healthy', 'degraded', 'failed', 'disabled');

CREATE TABLE connectors (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id           VARCHAR(64) UNIQUE NOT NULL,
    display_name        VARCHAR(255) NOT NULL,
    description         TEXT,
    refresh_cron        VARCHAR(100) NOT NULL DEFAULT '0 * * * *',
    rate_limit_rps      INT NOT NULL DEFAULT 2,
    timeout_seconds     INT NOT NULL DEFAULT 30,
    max_retries         INT NOT NULL DEFAULT 3,
    health_status       connector_health NOT NULL DEFAULT 'healthy',
    last_sync_at        TIMESTAMPTZ,
    last_success_at     TIMESTAMPTZ,
    last_error          TEXT,
    consecutive_failures INT NOT NULL DEFAULT 0,
    tenders_total       INT NOT NULL DEFAULT 0,
    config              JSONB DEFAULT '{}',
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sync_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id    UUID NOT NULL REFERENCES connectors(id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'running',
    tenders_found   INT NOT NULL DEFAULT 0,
    tenders_new     INT NOT NULL DEFAULT 0,
    tenders_updated INT NOT NULL DEFAULT 0,
    tenders_failed  INT NOT NULL DEFAULT 0,
    error_message   TEXT,
    duration_seconds INT
);

CREATE INDEX idx_sync_jobs_connector ON sync_jobs(connector_id, started_at DESC);

-- ─────────────────────────────────────────────────────────────
-- ANALYTICS (Materialized)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE analytics_snapshots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date   DATE NOT NULL,
    metric_type     VARCHAR(64) NOT NULL,  -- ministry_spending | category_trend | state_volume
    dimension       VARCHAR(255) NOT NULL, -- ministry/category/state name
    value           DECIMAL(20,2) NOT NULL,
    count           INT NOT NULL DEFAULT 0,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(snapshot_date, metric_type, dimension)
);

CREATE INDEX idx_analytics_date_type ON analytics_snapshots(snapshot_date DESC, metric_type);

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    resource    VARCHAR(100),
    resource_id VARCHAR(255),
    metadata    JSONB DEFAULT '{}',
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- GOVERNANCE & DATA QUALITY
-- ─────────────────────────────────────────────────────────────

CREATE TABLE bid_approval_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id       UUID NOT NULL,
    reviewer_role   VARCHAR(50) NOT NULL,
    reviewer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,
    comments        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_model_registry (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name      VARCHAR(100) NOT NULL,
    version         VARCHAR(50) NOT NULL,
    provider        VARCHAR(100) NOT NULL,
    prompt_version  VARCHAR(50) NOT NULL,
    temperature     DECIMAL(3,2) DEFAULT 0.00,
    cost_per_token  DECIMAL(10,8),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(model_name, version, prompt_version)
);

CREATE TABLE decision_audit_trail (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id           UUID NOT NULL,
    user_id             UUID REFERENCES users(id),
    recommendation      VARCHAR(50) NOT NULL,
    confidence_score    DECIMAL(3,2) NOT NULL,
    evidence            JSONB DEFAULT '[]',
    model_id            UUID REFERENCES ai_model_registry(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE data_quality_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_type          VARCHAR(64) NOT NULL,
    status              VARCHAR(20) NOT NULL,
    details             JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- BID WORKFLOWS (Human-in-the-Loop Approval Chain)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE workflow_state AS ENUM (
    'AI_RECOMMENDATION',
    'TECHNICAL_REVIEW',
    'FINANCE_REVIEW',
    'LEGAL_REVIEW',
    'MANAGEMENT_APPROVAL',
    'BID_SUBMISSION',
    'TENDER_PUBLISHED',
    'CORRIGENDUM_ISSUED',
    'PRE_BID_MEETING',
    'CLARIFICATIONS',
    'TECHNICAL_BID_SUBMITTED',
    'TECHNICAL_EVALUATION',
    'FINANCIAL_BID_OPENED',
    'L1_DETERMINED',
    'AWARD_LOA',
    'AGREEMENT_SIGNED',
    'WORK_ORDER_ISSUED',
    'EXECUTION',
    'INVOICE_SUBMITTED',
    'PAYMENT_RELEASED',
    'COMPLETION_CERTIFICATE',
    'PBG_RELEASE'
);

CREATE TABLE bid_workflows (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id               UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    company_id              UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    state                   workflow_state NOT NULL DEFAULT 'AI_RECOMMENDATION',
    go_no_go_score          DECIMAL(5,2),
    go_no_go_reasoning      TEXT,
    emd_amount_lakhs        DECIMAL(12,2),
    emd_mode                VARCHAR(100),       -- bank_guarantee | demand_draft | exemption_msme | exemption_startup
    technical_score         DECIMAL(5,2),
    financial_quote_lakhs   DECIMAL(15,2),
    is_l1                   BOOLEAN,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bid_workflows_tender ON bid_workflows(tender_id);
CREATE INDEX idx_bid_workflows_company ON bid_workflows(company_id);

CREATE TABLE bid_workflow_transitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id     UUID NOT NULL REFERENCES bid_workflows(id) ON DELETE CASCADE,
    from_state      workflow_state NOT NULL,
    to_state        workflow_state NOT NULL,
    transitioned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    comments        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wf_transitions_workflow ON bid_workflow_transitions(workflow_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- AWARD HISTORY (Knowledge Graph Seed)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE award_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id           UUID REFERENCES tenders(id) ON DELETE SET NULL,
    winner_name         VARCHAR(500) NOT NULL,
    winner_company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
    l1_amount_lakhs     DECIMAL(15,2),
    our_amount_lakhs    DECIMAL(15,2),
    award_date          DATE,
    source              VARCHAR(64),
    ministry            VARCHAR(255),
    department          VARCHAR(255),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_award_history_tender ON award_history(tender_id);
CREATE INDEX idx_award_history_winner ON award_history(winner_company_id);

-- ─────────────────────────────────────────────────────────────
-- FUNCTIONS & TRIGGERS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tender_document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    document_name VARCHAR(255),
    chunk_index INT,
    page INT,
    content TEXT
);

CREATE INDEX idx_tender_document_chunks_tender ON tender_document_chunks(tender_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_documents_updated_at BEFORE UPDATE ON company_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default connectors
INSERT INTO connectors (source_id, display_name, description, refresh_cron, rate_limit_rps) VALUES
('mock', 'Mock Data Connector', 'Development seed data connector', '*/30 * * * *', 10),
('gem', 'Government e-Marketplace', 'Official GeM procurement portal', '*/20 * * * *', 3),
('cppp', 'Central Public Procurement Portal', 'CPPP tender feed', '0 * * * *', 2),
('maharashtra', 'Maharashtra Tenders', 'State procurement portal', '0 */4 * * *', 1),
('railways', 'Indian Railways IREPS', 'Railway procurement portal', '0 */6 * * *', 1);

