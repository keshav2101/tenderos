#!/usr/bin/env python3
import asyncio
import os
import random
import sys
from datetime import datetime, timedelta
from uuid import uuid4
import asyncpg

PG_DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgresql://postgres:hMftELunyqDbdAjJlHsKStplLhgrPOgG@tramway.proxy.rlwy.net:40786/railway",
)

CATEGORIES_DATA = [
    ("AI", ["AI-based Fraud Detection System", "Machine Learning Platform for Smart City", "AI Chatbot for Citizen Services", "NLP System for Legal Document Analysis"]),
    ("Cybersecurity", ["SOC Setup and Management Services", "Penetration Testing Services", "SIEM Solution Deployment", "Cyber Forensics Lab Setup"]),
    ("Healthcare", ["Hospital Information Management System", "Telemedicine Platform", "EHR System Implementation", "Lab Information System"]),
    ("IT", ["Data Center Setup", "Cloud Migration Services", "ERP Implementation", "Network Upgradation and Wi-Fi Infrastructure"]),
    ("Drone", ["Drone-based Survey and Mapping", "Agricultural Spraying Drones", "Border Surveillance Drone System", "Traffic Monitoring Drone Fleet"]),
    ("Construction", ["Government Office Complex Construction", "Road Widening Works", "Bridge Construction", "Smart City Infrastructure Development"]),
    ("Renewable Energy", ["Solar Power Plant Installation", "EV Charging Infrastructure", "Smart Metering Solution", "Rooftop Solar for Government Schools"]),
    ("Cloud", ["Cloud Infrastructure Services for Government", "GI Cloud Expansion", "Disaster Recovery as a Service", "Cloud Security Assessment"]),
    ("IoT", ["Smart Street Lighting IoT Solution", "Water Quality Monitoring IoT", "Air Quality Monitoring Network", "Fleet Tracking and Telematics"]),
    ("Data Analytics", ["Business Intelligence and Analytics Platform", "Big Data Processing Platform", "Predictive Maintenance Analytics", "Open Data Portal Development"]),
    ("Medical Equipment", ["MRI Machine 3T Procurement", "CT Scanner Procurement", "Ventilator Procurement", "Dialysis Machine Procurement"]),
    ("Smart City", ["Integrated Command and Control Centre", "Smart Traffic Management System", "City-wide Wi-Fi Infrastructure", "Digital Signage System"]),
    ("GIS", ["GIS Mapping for Land Records", "Urban Planning GIS Platform", "Satellite Image Procurement", "Property Tax GIS Integration"]),
    ("Education", ["Learning Management System", "Smart Classrooms Setup", "Online Examination System", "Student Information System"]),
    ("Defence", ["Bullet Proof Vehicles Procurement", "Communication Equipment", "Night Vision Devices Procurement", "Body Armor Procurement"])
]

MINISTRIES = [
    "Ministry of Electronics and Information Technology", "Ministry of Health and Family Welfare",
    "Ministry of Defence", "Ministry of Railways", "Ministry of Urban Development",
    "Ministry of Agriculture", "Ministry of Education", "Ministry of Power",
    "Ministry of Finance", "Ministry of Home Affairs", "Ministry of Science and Technology",
    "Ministry of Road Transport and Highways"
]

DEPARTMENTS_BY_MINISTRY = {
    "Ministry of Electronics and Information Technology": ["NIC", "C-DAC", "STQC", "NeGD"],
    "Ministry of Health and Family Welfare": ["AIIMS Delhi", "AIIMS Mumbai", "ICMR", "NHM"],
    "Ministry of Defence": ["DRDO", "HAL", "BEL", "Army HQ", "Navy HQ"],
    "Ministry of Railways": ["Northern Railway", "RITES", "IRCON", "RAILTEL"],
    "Ministry of Urban Development": ["CPWD", "NDMC", "Smart Cities Mission"],
    "Ministry of Finance": ["Income Tax Department", "GSTN", "Department of Expenditure"],
    "Ministry of Education": ["UGC", "AICTE", "IIT Delhi", "IIT Bombay"],
    "Ministry of Power": ["NTPC", "NHPC", "PGCIL", "REC"]
}

STATES = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Uttar Pradesh", "West Bengal", "Rajasthan", "Andhra Pradesh", "Telangana", "Kerala", "Haryana", "Punjab", "Bihar"]
CERTS_POOL = ["ISO 9001:2015", "ISO 27001:2022", "ISO 20000-1:2018", "CMMI Level 3", "CMMI Level 5", "CERT-In Empanelment", "STQC Certification"]
SOURCES = ["cppp", "gem", "maharashtra", "railways", "defence", "mock"]

def make_tender():
    cat_name, titles = random.choice(CATEGORIES_DATA)
    title = random.choice(titles)
    if random.random() > 0.7:
        title += f" — Phase {random.randint(1, 3)}"

    ministry = random.choice(MINISTRIES)
    dept_list = DEPARTMENTS_BY_MINISTRY.get(ministry, ["General Department"])
    department = random.choice(dept_list)
    state = random.choice(STATES)

    cost = round(random.choices([random.uniform(5, 50), random.uniform(50, 500), random.uniform(500, 5000), random.uniform(5000, 25000)], weights=[0.35, 0.35, 0.20, 0.10])[0], 2)
    msme = random.random() < 0.4
    startup = random.random() < 0.15

    now = datetime.utcnow()
    published = now - timedelta(days=random.randint(1, 60))
    deadline = published + timedelta(days=random.randint(14, 90))

    extra_cats = []
    if cat_name == "AI":
        extra_cats = random.sample(["IT", "Data Analytics", "Cloud"], k=random.randint(0, 2))
    elif cat_name == "Smart City":
        extra_cats = random.sample(["IoT", "IT", "GIS"], k=random.randint(0, 2))

    turnover = round(cost * random.uniform(1.5, 3.0), 2) if cost > 50 else None
    exp_years = random.choice([3, 5, 7]) if cost > 100 else random.choice([1, 2, 3])
    certs = random.sample(CERTS_POOL, k=random.randint(0, 2))

    ai_summary = (
        f"Procurement of {title.lower()} by {department} under {ministry}. "
        f"Estimated cost: ₹{cost:.2f} Lakhs. "
        f"{'MSME bidders are EMD exempt. ' if msme else ''}"
        f"Submissions due {deadline.strftime('%d %b %Y')}."
    )

    return {
        "id": str(uuid4()),
        "title": title,
        "source": random.choice(SOURCES),
        "source_tender_id": f"TOS/{now.year}/{random.randint(1000, 99999):05d}",
        "source_url": f"https://cppp.gov.in/tender/{random.randint(1000000, 9999999)}",
        "ministry": ministry,
        "department": department,
        "organisation": department,
        "state": state,
        "categories": [cat_name] + extra_cats,
        "estimated_cost_lakhs": cost,
        "emd_lakhs": round(cost * 0.025, 2) if not msme else 0.0,
        "tender_fee": float(random.choice([0, 500, 1000, 2000, 5000])),
        "performance_guarantee_pct": 10.0,
        "procurement_method": random.choice(["open", "limited", "e-tendering", "gem"]),
        "status": random.choice(["active", "active", "active", "active", "closed"]),
        "published_at": published,
        "submission_deadline": deadline,
        "opening_date": deadline + timedelta(days=1),
        "bid_validity_days": random.choice([90, 120, 180]),
        "work_completion_days": random.choice([180, 270, 365, 540]),
        "turnover_min_lakhs": turnover,
        "experience_years": exp_years,
        "certifications_required": certs,
        "msme_eligible": msme,
        "startup_eligible": startup,
        "ai_summary": ai_summary,
        "extraction_tier": 1,
        "extraction_confidence": round(random.uniform(0.70, 0.99), 2),
    }

async def main(count):
    print(f"Generating {count} tenders...")
    tenders = [make_tender() for _ in range(count)]
    print(f"Connecting to Postgres at {PG_DSN}...")
    conn = await asyncpg.connect(PG_DSN)
    print("Inserting tenders...")
    inserted = 0
    for t in tenders:
        try:
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
                    $21, $22, $23, $24, $25, $26, $27, $28, $29
                )
                ON CONFLICT (source, source_tender_id) DO NOTHING
                """,
                t["id"], t["title"], t["source"], t["source_tender_id"], t["source_url"],
                t["ministry"], t["department"], t["organisation"], t["state"], t["categories"],
                t["estimated_cost_lakhs"], t["emd_lakhs"], t["tender_fee"], t["performance_guarantee_pct"],
                t["procurement_method"], t["status"], t["published_at"], t["submission_deadline"],
                t["opening_date"], t["bid_validity_days"], t["work_completion_days"],
                t["turnover_min_lakhs"], t["experience_years"], t["certifications_required"],
                t["msme_eligible"], t["startup_eligible"], t["ai_summary"],
                t["extraction_tier"], t["extraction_confidence"]
            )
            inserted += 1
        except Exception as e:
            print(f"Error inserting: {e}")
    print(f"Successfully seeded {inserted} tenders into PostgreSQL.")
    await conn.close()

if __name__ == "__main__":
    count = 100
    if len(sys.argv) > 1:
        count = int(sys.argv[1])
    asyncio.run(main(count))
