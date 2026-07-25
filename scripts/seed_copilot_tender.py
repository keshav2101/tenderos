#!/usr/bin/env python3
import asyncio
import os
from datetime import datetime, timedelta
import asyncpg

PG_DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgresql://postgres:hMftELunyqDbdAjJlHsKStplLhgrPOgG@tramway.proxy.rlwy.net:40786/railway",
)

async def main():
    print(f"Connecting to database to insert copilot demo tender...")
    conn = await asyncpg.connect(PG_DSN)
    
    tender_id = "e864a9ca-dd09-476b-95f1-04ecfdb3e868"
    title = "Design, Development, and Maintenance of Smart City GIS Platform and Citizen Portal"
    source = "gem"
    source_tender_id = "GEM/2026/B/8762410"
    source_url = "https://gem.gov.in/show-tender/8762410"
    ministry = "Ministry of Housing and Urban Affairs"
    department = "Smart Cities Mission"
    organisation = "Delhi Smart City Limited"
    state = "Delhi"
    categories = ["AI", "IT", "GIS", "Smart City"]
    cost = 750.0  # ₹7.5 Crore
    emd = 0.0     # MSME exempt
    fee = 0.0
    pg_pct = 3.0  # 3% PBG
    procurement_method = "gem"
    status = "active"
    
    now = datetime.utcnow()
    published = now - timedelta(days=2)
    deadline = now + timedelta(days=28)
    opening = deadline + timedelta(days=1)
    
    turnover = 1500.0  # Required turnover
    exp_years = 5
    certs = ["ISO 9001:2015", "ISO 27001:2022", "CMMI Level 3"]
    msme = True
    startup = True
    
    ai_summary = (
        "Design, Development, and Maintenance of Smart City GIS Platform and Citizen Portal. "
        "Includes real-time data visualization, citizen dashboard, and GIS-mapped land records. "
        "MSME and Startup bidders are exempt from EMD and prior experience criteria. "
        "Submissions are due via GeM portal by 22 Aug 2026."
    )
    
    print("Upserting copilot demo tender...")
    try:
        # Delete existing if any
        await conn.execute("DELETE FROM tenders WHERE id = $1", tender_id)
        
        await conn.execute(
            """
            INSERT INTO tenders (
                id, title, source, source_tender_id, source_url,
                ministry, department, organisation, state, categories,
                estimated_cost_lakhs, emd_lakhs, tender_fee, performance_guarantee_pct,
                procurement_method, status, published_at, submission_deadline,
                opening_date, bid_validity_days, work_completion_days,
                turnover_min_lakhs, experience_years, certifications_required,
                msme_eligible, startup_eligible, ai_summary,
                extraction_tier, extraction_confidence
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15::procurement_method, $16::tender_status, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, 1, 0.98
            )
            """,
            tender_id, title, source, source_tender_id, source_url,
            ministry, department, organisation, state, categories,
            cost, emd, fee, pg_pct,
            procurement_method, status, published, deadline,
            opening, 180, 365,
            turnover, exp_years, certs,
            msme, startup, ai_summary
        )
        print(f"Successfully upserted copilot demo tender {tender_id}.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
