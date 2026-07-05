-- ============================================================
-- TenderOS v1.0.0 — Demo Seed Data
-- Matches schema in infrastructure/postgres/init.sql
-- Run AFTER Docker postgres container is up:
--   docker exec -i tenderos-postgres psql -U tenderos -d tenderos < infrastructure/postgres/seed_demo.sql
--
-- GENERATED BCRYPT HASHES (cost=12):
--   admin@tenderos.in        AdminSecure@TenderOS2026!
--   enterprise@demo.in       EnterpriseDemo@2026!
--   consultant@demo.in       ConsultantDemo@2026!
--   msme@demo.in             MSMEDemoExemption@2026!
--   startup@demo.in          StartupRelaxation@2026!
--   viewer@demo.in           ViewerAccessOnly@2026!
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TENANTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO tenants (id, domain, display_name) VALUES
('00000000-0000-0000-0000-000000000001', 'tenderos.in', 'TenderOS Platform'),
('00000000-0000-0000-0000-000000000002', 'demo.in',     'TenderOS Demo Org')
ON CONFLICT (domain) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- USERS  (6 test accounts)
-- ─────────────────────────────────────────────────────────────
INSERT INTO users (
    id, email, name, password_hash, role, plan,
    is_active, is_verified, tenant_id
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'admin@tenderos.in',
    'System Administrator',
    '$2b$12$F3lLcOP..vtJWrrUi4t0S.uyRSefeiDnaS6ybKjwlLRxosF5Z2AlO',
    'admin', 'enterprise', TRUE, TRUE,
    '00000000-0000-0000-0000-000000000001'
),
(
    '10000000-0000-0000-0000-000000000002',
    'enterprise@demo.in',
    'Enterprise Demo User',
    '$2b$12$eDgQGqMvfUYrHRiVZz3/vuX4TYbt.53FifQ7.f67McQjNggkdWNOe',
    'enterprise', 'enterprise', TRUE, TRUE,
    '00000000-0000-0000-0000-000000000002'
),
(
    '10000000-0000-0000-0000-000000000003',
    'consultant@demo.in',
    'Procurement Consultant',
    '$2b$12$1bZllTrrxj4/jBYhE.jbt.5JtSS4JaCh7sfaiQxv2D51/Z2brkFb6',
    'consultant', 'sme', TRUE, TRUE,
    '00000000-0000-0000-0000-000000000002'
),
(
    '10000000-0000-0000-0000-000000000004',
    'msme@demo.in',
    'MSME Bidder (Udyam Registered)',
    '$2b$12$V13jJ3La9Vh.FlUy5UCRQu.uojFQEmaX1G2dF58ZTnTxMUC9Ae40q',
    'sme', 'sme', TRUE, TRUE,
    '00000000-0000-0000-0000-000000000002'
),
(
    '10000000-0000-0000-0000-000000000005',
    'startup@demo.in',
    'DPIIT Startup User',
    '$2b$12$lH0xd69LsHBz0TFctcPUS.uTK.U7aDG12gmxsfUPtRAlaJpfFKpWK',
    'sme', 'sme', TRUE, TRUE,
    '00000000-0000-0000-0000-000000000002'
),
(
    '10000000-0000-0000-0000-000000000006',
    'viewer@demo.in',
    'Read-Only Viewer',
    '$2b$12$gAE3mf1AXE7hHba8R5xHcubpm90DVn6XyZvOkQPQG9EIlBGKiTTkC',
    'viewer', 'free', TRUE, TRUE,
    '00000000-0000-0000-0000-000000000002'
)
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- COMPANIES (Digital Twins) — using actual schema columns
-- ─────────────────────────────────────────────────────────────
INSERT INTO companies (
    id, user_id, legal_name, gstin, pan, cin,
    entity_type, employees, founded_year,
    registered_address,
    products_services, target_categories,
    primary_domain, profile_score, is_verified
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'Acme Engineering Solutions Pvt Ltd',
    '27AACCA1234B1Z5', 'AACCA1234B', 'U74999MH2018PTC123456',
    'MSME_Small', 42, 2018,
    '503, Nariman Point, Mumbai, Maharashtra 400001',
    ARRAY['IT Software', 'System Integration', 'Cloud Infrastructure'],
    ARRAY['IT Software', 'System Integration', 'Cloud Services', 'AI/ML'],
    'Information Technology', 78.50, TRUE
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000005',
    'InnovateTech Startup LLP',
    '27AAJFI5678C1Z9', 'AAJFI5678C', NULL,
    'Startup', 15, 2022,
    '12B, 4th Cross, Koramangala, Bengaluru, Karnataka 560034',
    ARRAY['AI/ML Platform', 'Data Analytics', 'SaaS Solutions'],
    ARRAY['AI/ML', 'Data Analytics', 'SaaS', 'Digital Transformation'],
    'Artificial Intelligence', 65.00, TRUE
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'BuildRight Infrastructure Ltd',
    '07AADCB5678D1ZP', 'AADCB5678D', 'L45201DL2010PLC200789',
    'Large', 350, 2010,
    '88, Connaught Place, New Delhi 110001',
    ARRAY['Civil Construction', 'Road Projects', 'Bridge Works'],
    ARRAY['Civil Construction', 'Roads', 'Bridges', 'EPC', 'Infrastructure'],
    'Civil Engineering', 91.00, TRUE
)
ON CONFLICT DO NOTHING;

-- Company turnover records
INSERT INTO company_turnover (company_id, year, value_lakhs, verification_status) VALUES
('20000000-0000-0000-0000-000000000001', 2024, 850.00,  'verified'),
('20000000-0000-0000-0000-000000000001', 2023, 720.00,  'verified'),
('20000000-0000-0000-0000-000000000002', 2024, 120.00,  'verified'),
('20000000-0000-0000-0000-000000000003', 2024, 12500.00,'verified'),
('20000000-0000-0000-0000-000000000003', 2023, 10800.00,'verified')
ON CONFLICT DO NOTHING;

-- Company registrations (GeM, Udyam, DPIIT)
INSERT INTO company_registrations (company_id, registration_type, registration_number, valid_until, verification_status) VALUES
('20000000-0000-0000-0000-000000000001', 'UDYAM', 'UDYAM-MH-05-0012345', '2029-03-31', 'verified'),
('20000000-0000-0000-0000-000000000001', 'GeM Seller', 'GEM-SELLER-ABC123456', NULL, 'verified'),
('20000000-0000-0000-0000-000000000002', 'DPIIT Startup',  'DIPP123456', '2027-06-30', 'verified'),
('20000000-0000-0000-0000-000000000002', 'GeM Seller', 'GEM-SELLER-XYZ789012', NULL, 'verified'),
('20000000-0000-0000-0000-000000000003', 'ISO 9001', 'ISO9001-2024-BRIF', '2027-09-30', 'verified')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SAMPLE TENDERS (6 representative GeM / CPPP / IREPS tenders)
-- ─────────────────────────────────────────────────────────────
INSERT INTO tenders (
    id, source, source_tender_id, source_url,
    title, ministry, department, organisation,
    state, district, location,
    estimated_cost_lakhs, emd_lakhs, tender_fee,
    categories, procurement_method, status,
    published_at, submission_deadline, opening_date,
    msme_eligible, startup_eligible
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    'gem', 'GEM/2026/B/12345678', 'https://gem.gov.in/bidding/12345678',
    'Supply of AI-Powered Surveillance Systems for Smart City Initiative — Tier 1 Cities',
    'Ministry of Housing and Urban Affairs',
    'Smart Cities Mission Directorate',
    'NMCG-Delhi Smart City Authority',
    'Delhi', 'New Delhi', 'New Delhi, Delhi',
    480.00, 9.60, 2500.00,
    ARRAY['AI/ML', 'Surveillance', 'Smart City', 'IoT', 'Electronics'],
    'gem', 'active',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    NOW() + INTERVAL '26 days',
    FALSE, TRUE
),
(
    '30000000-0000-0000-0000-000000000002',
    'cppp', 'CPPP/2026/NCB/MH/789012', 'https://eprocure.gov.in/tender/789012',
    'Construction of Rural Road Network under PMGSY Phase III — Maharashtra Districts',
    'Ministry of Rural Development',
    'National Rural Roads Development Agency',
    'Maharashtra Public Works Department',
    'Maharashtra', 'Pune', 'Pune Division, Maharashtra',
    2400.00, 48.00, 10000.00,
    ARRAY['Civil Construction', 'Roads', 'Rural Infrastructure', 'PMGSY'],
    'open', 'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '42 days',
    NOW() + INTERVAL '43 days',
    FALSE, FALSE
),
(
    '30000000-0000-0000-0000-000000000003',
    'gem', 'GEM/2026/B/11223344', 'https://gem.gov.in/bidding/11223344',
    'Procurement of Cloud ERP Software for Government Departments — SaaS Annual Subscription',
    'Ministry of Electronics and Information Technology',
    'National Informatics Centre',
    'NIC HQ New Delhi',
    'Delhi', 'New Delhi', 'New Delhi',
    125.00, 2.50, 1000.00,
    ARRAY['ERP', 'Cloud', 'SaaS', 'Software', 'MeITY'],
    'gem', 'active',
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '16 days',
    TRUE, TRUE
),
(
    '30000000-0000-0000-0000-000000000004',
    'railways', 'IREPS/2026/CRIS/5544332', 'https://ireps.gov.in/tender/5544332',
    'Supply and Installation of Passenger Information Display Systems at Railway Stations — Western Zone',
    'Ministry of Railways',
    'Centre for Railway Information Systems',
    'Indian Railways Western Zone — Ahmedabad Division',
    'Gujarat', 'Ahmedabad', 'Ahmedabad, Gujarat',
    320.00, 6.40, 5000.00,
    ARRAY['IoT', 'Display Systems', 'Railways', 'Electronics', 'Passenger Amenities'],
    'open', 'active',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '35 days',
    NOW() + INTERVAL '36 days',
    FALSE, TRUE
),
(
    '30000000-0000-0000-0000-000000000005',
    'cppp', 'CPPP/2026/EOI/KA/334455', 'https://eprocure.gov.in/tender/334455',
    'Expression of Interest: Empanelment of AI/ML Solution Providers for Karnataka Digital Transformation 2026',
    'Karnataka State Government',
    'Department of Information Technology & Biotechnology',
    'KEONICS — Karnataka Electronics Corporation',
    'Karnataka', 'Bengaluru', 'Bengaluru, Karnataka',
    0.00, 0.00, 500.00,
    ARRAY['AI/ML', 'Digital Transformation', 'Government Technology', 'SaaS'],
    'eoi', 'active',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '28 days',
    NOW() + INTERVAL '29 days',
    TRUE, TRUE
),
(
    '30000000-0000-0000-0000-000000000006',
    'gem', 'GEM/2025/B/09988776', 'https://gem.gov.in/bidding/09988776',
    'Annual Maintenance Contract for IT Infrastructure — AIIMS New Delhi',
    'Ministry of Health and Family Welfare',
    'All India Institute of Medical Sciences',
    'AIIMS New Delhi',
    'Delhi', 'New Delhi', 'Ansari Nagar, New Delhi',
    85.00, 1.70, 500.00,
    ARRAY['IT Infrastructure', 'AMC', 'Healthcare IT', 'Networking'],
    'open', 'closed',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '14 days',
    TRUE, FALSE
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SAMPLE BID WORKFLOWS
-- ─────────────────────────────────────────────────────────────
INSERT INTO bid_workflows (
    id, tender_id, company_id, created_by,
    state, go_no_go_score, go_no_go_reasoning,
    emd_amount_lakhs, emd_mode, technical_score
) VALUES
(
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000005',
    'TECHNICAL_BID_SUBMITTED',
    78.5,
    'Strong alignment: AI/ML capability matches RFP requirements. DPIIT exemption applies — EMD fully waived. MII compliance achieved with in-house AI stack. Risk: Tight 6-month delivery timeline requires dedicated sprint team.',
    0.00, 'exemption_startup',
    72.0
),
(
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'FINANCIAL_BID_OPENED',
    85.2,
    'Excellent fit: Cloud ERP expertise with Udyam registration. MSME EMD exemption applicable under GFR 2017. Prior deliveries: 3 NIC deployments in last 5 years. Competitive cost advantage vs L2 bidder.',
    0.00, 'exemption_msme',
    89.0
)
ON CONFLICT DO NOTHING;

-- Workflow transition history
INSERT INTO bid_workflow_transitions (workflow_id, from_state, to_state, transitioned_by, comments) VALUES
(
    '40000000-0000-0000-0000-000000000001',
    'AI_RECOMMENDATION', 'TECHNICAL_REVIEW',
    '10000000-0000-0000-0000-000000000005',
    'AI copilot recommendation reviewed and accepted by technical lead'
),
(
    '40000000-0000-0000-0000-000000000001',
    'TECHNICAL_REVIEW', 'MANAGEMENT_APPROVAL',
    '10000000-0000-0000-0000-000000000003',
    'Technical feasibility confirmed. Escalated to management for bid approval'
),
(
    '40000000-0000-0000-0000-000000000001',
    'MANAGEMENT_APPROVAL', 'BID_SUBMISSION',
    '10000000-0000-0000-0000-000000000002',
    'Management approved. Bid submission authorised by enterprise admin.'
),
(
    '40000000-0000-0000-0000-000000000001',
    'BID_SUBMISSION', 'TECHNICAL_BID_SUBMITTED',
    '10000000-0000-0000-0000-000000000005',
    'Technical bid uploaded on GeM portal. Submission reference: GEM-SUB-2026-TBS-99887'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- AWARD HISTORY
-- ─────────────────────────────────────────────────────────────
INSERT INTO award_history (
    id, tender_id, winner_name, winner_company_id,
    l1_amount_lakhs, our_amount_lakhs,
    award_date, source, ministry, department
) VALUES
(
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000006',
    'Acme Engineering Solutions Pvt Ltd',
    '20000000-0000-0000-0000-000000000001',
    82.50, 82.50,
    CURRENT_DATE - INTERVAL '14 days',
    'gem',
    'Ministry of Health and Family Welfare',
    'AIIMS New Delhi'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- BID QUALIFICATIONS (Pre-computed AI recommendations)
-- ─────────────────────────────────────────────────────────────
INSERT INTO bid_qualifications (
    company_id, tender_id,
    match_score, eligibility_score, winning_probability,
    confidence, eligible, recommendation, recommendation_reason,
    estimated_prep_hours,
    missing_documents, key_risks, advantages
) VALUES
(
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    82, 90, 65, 'HIGH', TRUE, 'GO',
    'Strong AI/ML competency. DPIIT exemption waives EMD ₹9.6L. Make in India compliant. Startup relaxation applies for turnover criteria.',
    40,
    ARRAY[]::TEXT[],
    ARRAY['Tight delivery timeline 6 months', 'Competition from larger incumbents'],
    ARRAY['DPIIT exemption for EMD', 'AI/ML niche specialisation', 'Startup relaxation applicable']
),
(
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    89, 95, 72, 'HIGH', TRUE, 'GO',
    'Excellent ERP cloud delivery track record. MSME Udyam exemption for EMD. Class-I local supplier. 3 prior NIC deliveries qualify as experience.',
    25,
    ARRAY[]::TEXT[],
    ARRAY['Price competition from large SI bidders'],
    ARRAY['MSME EMD exemption', 'Class-I local supplier preference', '3x NIC experience proof']
),
(
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000005',
    91, 100, 80, 'HIGH', TRUE, 'GO',
    'EOI perfectly aligned with AI/ML capability. DPIIT startup exemptions apply. No financial barriers — zero tender fee for startups.',
    8,
    ARRAY[]::TEXT[],
    ARRAY['EOI does not guarantee work order', 'Multiple empanellment slots'],
    ARRAY['Perfect domain alignment', 'All exemptions applicable', 'Strong competitive differentiation']
)
ON CONFLICT (company_id, tender_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- DECISION AUDIT TRAIL
-- ─────────────────────────────────────────────────────────────
INSERT INTO decision_audit_trail (
    id, tender_id, user_id,
    recommendation, confidence_score, evidence,
    model_id, created_at
) VALUES
(
    '60000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004',
    'GO', 0.85,
    '[{"source": "Udyam Exemption", "notes": "MSME EMD exemption applicable"}]'::jsonb,
    '70000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '5 days'
),
(
    '60000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000005',
    'GO', 0.79,
    '[{"source": "DPIIT Exemption", "notes": "DPIIT startup EMD exemption"}]'::jsonb,
    '70000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '8 days'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- AI MODEL REGISTRY
-- ─────────────────────────────────────────────────────────────
INSERT INTO ai_model_registry (
    id, model_name, version, provider,
    prompt_version, temperature, cost_per_token,
    is_active, created_at
) VALUES
(
    '70000000-0000-0000-0000-000000000001', 'gemini-1.5-pro', '1.5', 'google',
    'v1.0', 0.00, 0.000007,
    TRUE, NOW()
),
(
    '70000000-0000-0000-0000-000000000002', 'gemini-1.5-flash', '1.5', 'google',
    'v1.0', 0.00, 0.00000075,
    TRUE, NOW()
),
(
    '70000000-0000-0000-0000-000000000003', 'text-embedding-004', '004', 'google',
    'v1.0', 0.00, 0.00000003,
    TRUE, NOW()
)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- ANALYTICS SNAPSHOTS (Dashboard sample data)
-- ─────────────────────────────────────────────────────────────
INSERT INTO analytics_snapshots (snapshot_date, metric_type, dimension, value, count) VALUES
-- Ministry spending (₹ Lakhs)
(CURRENT_DATE, 'ministry_spending', 'Ministry of Housing and Urban Affairs', 480.00, 1),
(CURRENT_DATE, 'ministry_spending', 'Ministry of Rural Development',         2400.00, 1),
(CURRENT_DATE, 'ministry_spending', 'Ministry of Electronics and IT',        125.00, 1),
(CURRENT_DATE, 'ministry_spending', 'Ministry of Railways',                  320.00, 1),
(CURRENT_DATE, 'ministry_spending', 'Karnataka State Government',            0.00, 1),
(CURRENT_DATE, 'ministry_spending', 'Ministry of Health and Family Welfare', 85.00, 1),
-- Category volume
(CURRENT_DATE, 'category_volume', 'AI/ML',               605.00, 3),
(CURRENT_DATE, 'category_volume', 'Civil Construction',  2400.00, 1),
(CURRENT_DATE, 'category_volume', 'ERP/Cloud Software',  125.00, 1),
(CURRENT_DATE, 'category_volume', 'IoT/Electronics',     320.00, 1),
-- State volumes
(CURRENT_DATE, 'state_volume', 'Delhi',        690.00, 3),
(CURRENT_DATE, 'state_volume', 'Maharashtra',  2400.00, 1),
(CURRENT_DATE, 'state_volume', 'Gujarat',      320.00, 1),
(CURRENT_DATE, 'state_volume', 'Karnataka',    0.00, 1)
ON CONFLICT (snapshot_date, metric_type, dimension) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- WATCHLIST (Demo — MSME user watching AI tender)
-- ─────────────────────────────────────────────────────────────
INSERT INTO watchlists (user_id, tender_id, notes) VALUES
('10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'High priority — AI tender with MSME relaxations'),
('10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'Active bid in progress'),
('10000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'EOI perfectly aligned with our AI stack')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATION PREFERENCES
-- ─────────────────────────────────────────────────────────────
INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, new_tender, corrigendum, match_threshold) VALUES
('10000000-0000-0000-0000-000000000001', TRUE, FALSE, TRUE, TRUE, 60),
('10000000-0000-0000-0000-000000000002', TRUE, TRUE,  TRUE, TRUE, 70),
('10000000-0000-0000-0000-000000000003', TRUE, FALSE, TRUE, TRUE, 75),
('10000000-0000-0000-0000-000000000004', TRUE, TRUE,  TRUE, TRUE, 80),
('10000000-0000-0000-0000-000000000005', TRUE, FALSE, TRUE, TRUE, 80),
('10000000-0000-0000-0000-000000000006', TRUE, FALSE, FALSE, FALSE, 90)
ON CONFLICT (user_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE 'TenderOS v1.0.0 demo seed completed successfully.';
  RAISE NOTICE '6 users | 3 companies | 6 tenders | 2 workflows | 3 qualifications | 1 award record';
END $$;
