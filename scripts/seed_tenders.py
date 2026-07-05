#!/usr/bin/env python3
"""
Seed script — loads synthetic tenders into PostgreSQL and indexes them
into OpenSearch + Qdrant for search.

Usage:
  python scripts/seed_tenders.py [--count 500] [--env dev]
"""
import argparse
import asyncio
import json
import random
import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    import asyncpg
    from opensearchpy import AsyncOpenSearch
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import VectorParams, Distance, PointStruct
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Installing required packages...")
    os.system("pip install asyncpg opensearch-py qdrant-client sentence-transformers")
    import asyncpg

# ─── Config ───────────────────────────────────────────────────────────────────
PG_DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgresql://tenderos:tenderos_dev_password@localhost:5432/tenderos"
)
OPENSEARCH_URL = os.environ.get("OPENSEARCH_URL", "http://localhost:9200")
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

CATEGORIES_DATA = [
    ("AI", ["AI-based Fraud Detection System", "Machine Learning Platform for Smart City",
            "AI Chatbot for Citizen Services", "NLP System for Legal Document Analysis"]),
    ("Cybersecurity", ["SOC Setup and Management Services", "Penetration Testing Services",
                       "SIEM Solution Deployment", "Cyber Forensics Lab Setup"]),
    ("Healthcare", ["Hospital Information Management System", "Telemedicine Platform",
                    "EHR System Implementation", "Lab Information System"]),
    ("IT", ["Data Center Setup", "Cloud Migration Services", "ERP Implementation",
            "Network Upgradation and Wi-Fi Infrastructure"]),
    ("Drone", ["Drone-based Survey and Mapping", "Agricultural Spraying Drones",
               "Border Surveillance Drone System", "Traffic Monitoring Drone Fleet"]),
    ("Construction", ["Government Office Complex Construction", "Road Widening Works",
                      "Bridge Construction", "Smart City Infrastructure Development"]),
    ("Renewable Energy", ["Solar Power Plant Installation", "EV Charging Infrastructure",
                          "Smart Metering Solution", "Rooftop Solar for Government Schools"]),
    ("Cloud", ["Cloud Infrastructure Services for Government", "GI Cloud Expansion",
               "Disaster Recovery as a Service", "Cloud Security Assessment"]),
    ("IoT", ["Smart Street Lighting IoT Solution", "Water Quality Monitoring IoT",
             "Air Quality Monitoring Network", "Fleet Tracking and Telematics"]),
    ("Data Analytics", ["Business Intelligence and Analytics Platform", "Big Data Processing Platform",
                        "Predictive Maintenance Analytics", "Open Data Portal Development"]),
    ("Medical Equipment", ["MRI Machine 3T Procurement", "CT Scanner Procurement",
                           "Ventilator Procurement", "Dialysis Machine Procurement"]),
    ("Smart City", ["Integrated Command and Control Centre", "Smart Traffic Management System",
                    "City-wide Wi-Fi Infrastructure", "Digital Signage System"]),
    ("GIS", ["GIS Mapping for Land Records", "Urban Planning GIS Platform",
             "Satellite Image Procurement", "Property Tax GIS Integration"]),
    ("Education", ["Learning Management System", "Smart Classrooms Setup",
                   "Online Examination System", "Student Information System"]),
    ("Defence", ["Bullet Proof Vehicles Procurement", "Communication Equipment",
                 "Night Vision Devices Procurement", "Body Armor Procurement"]),
]

MINISTRIES = [
    "Ministry of Electronics and Information Technology",
    "Ministry of Health and Family Welfare", "Ministry of Defence",
    "Ministry of Railways", "Ministry of Urban Development",
    "Ministry of Agriculture", "Ministry of Education", "Ministry of Power",
    "Ministry of Finance", "Ministry of Home Affairs",
    "Ministry of Science and Technology", "Ministry of Road Transport and Highways",
]

DEPARTMENTS_BY_MINISTRY = {
    "Ministry of Electronics and Information Technology": ["NIC", "C-DAC", "STQC", "NeGD"],
    "Ministry of Health and Family Welfare": ["AIIMS Delhi", "AIIMS Mumbai", "ICMR", "NHM"],
    "Ministry of Defence": ["DRDO", "HAL", "BEL", "Army HQ", "Navy HQ"],
    "Ministry of Railways": ["Northern Railway", "RITES", "IRCON", "RAILTEL"],
    "Ministry of Urban Development": ["CPWD", "NDMC", "Smart Cities Mission"],
    "Ministry of Finance": ["Income Tax Department", "GSTN", "Department of Expenditure"],
    "Ministry of Education": ["UGC", "AICTE", "IIT Delhi", "IIT Bombay"],
    "Ministry of Power": ["NTPC", "NHPC", "PGCIL", "REC"],
}

STATES = [
    "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat",
    "Uttar Pradesh", "West Bengal", "Rajasthan", "Andhra Pradesh",
    "Telangana", "Kerala", "Haryana", "Punjab", "Bihar",
]

CERTS_POOL = [
    "ISO 9001:2015", "ISO 27001:2022", "ISO 20000-1:2018",
    "CMMI Level 3", "CMMI Level 5", "CERT-In Empanelment", "STQC Certification",
]

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

    cost = round(random.choices(
        [random.uniform(5, 50), random.uniform(50, 500),
         random.uniform(500, 5000), random.uniform(5000, 25000)],
        weights=[0.35, 0.35, 0.20, 0.10],
    )[0], 2)

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
        "source_id": random.choice(SOURCES),
        "source_tender_id": f"TOS/{now.year}/{random.randint(1000, 99999):05d}",
        "source_url": f"https://cppp.gov.in/tender/{random.randint(1000000, 9999999)}",
        "ministry": ministry,
        "department": department,
        "organisation": department,
        "state": state,
        "categories": [cat_name] + extra_cats,
        "estimated_cost_lakhs": cost,
        "emd_lakhs": round(cost * 0.025, 2) if not msme else 0,
        "tender_fee": random.choice([0, 500, 1000, 2000, 5000]),
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
        "ai_extraction_tier": 1,
        "extraction_confidence": round(random.uniform(0.70, 0.99), 2),
    }


async def seed_postgres(tenders: list, conn: asyncpg.Connection):
    print(f"  Inserting {len(tenders)} tenders into PostgreSQL...")
    inserted = 0
    for t in tenders:
        try:
            await conn.execute(
                """
                INSERT INTO tenders (
                    id, title, source_id, source_tender_id, source_url,
                    ministry, department, organisation, state, categories,
                    estimated_cost_lakhs, emd_lakhs, tender_fee, performance_guarantee_pct,
                    procurement_method, status, published_at, submission_deadline,
                    opening_date, bid_validity_days, work_completion_days,
                    turnover_min_lakhs, experience_years, certifications_required,
                    msme_eligible, startup_eligible, ai_summary,
                    ai_extraction_tier, extraction_confidence
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28, $29
                )
                ON CONFLICT (source_id, source_tender_id) DO NOTHING
                """,
                t["id"], t["title"], t["source_id"], t["source_tender_id"],
                t["source_url"], t["ministry"], t["department"], t["organisation"],
                t["state"], t["categories"], t["estimated_cost_lakhs"],
                t["emd_lakhs"], t["tender_fee"], t["performance_guarantee_pct"],
                t["procurement_method"], t["status"], t["published_at"],
                t["submission_deadline"], t["opening_date"], t["bid_validity_days"],
                t["work_completion_days"], t["turnover_min_lakhs"],
                t["experience_years"], t["certifications_required"],
                t["msme_eligible"], t["startup_eligible"], t["ai_summary"],
                t["ai_extraction_tier"], t["extraction_confidence"],
            )
            inserted += 1
        except Exception as e:
            print(f"    Warning: {e}")
    print(f"  ✓ PostgreSQL: {inserted}/{len(tenders)} tenders inserted")


async def seed_opensearch(tenders: list):
    print(f"  Indexing {len(tenders)} tenders into OpenSearch...")
    os_client = AsyncOpenSearch(hosts=[OPENSEARCH_URL])

    # Create index if not exists
    try:
        await os_client.indices.create(
            index="tenders",
            body={
                "settings": {"number_of_shards": 1, "number_of_replicas": 0},
                "mappings": {
                    "properties": {
                        "title": {"type": "text", "analyzer": "english"},
                        "ministry": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                        "department": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                        "organisation": {"type": "text"},
                        "state": {"type": "keyword"},
                        "categories": {"type": "keyword"},
                        "estimated_cost_lakhs": {"type": "float"},
                        "submission_deadline": {"type": "date"},
                        "published_at": {"type": "date"},
                        "status": {"type": "keyword"},
                        "msme_eligible": {"type": "boolean"},
                        "ai_summary": {"type": "text"},
                        "source": {"type": "keyword"},
                    }
                },
            },
        )
        print("  ✓ OpenSearch index created")
    except Exception as e:
        if "resource_already_exists" in str(e).lower():
            print("  ✓ OpenSearch index already exists")
        else:
            print(f"  Warning: OpenSearch index creation: {e}")

    # Bulk index
    bulk_body = []
    for t in tenders:
        bulk_body.append({"index": {"_index": "tenders", "_id": t["id"]}})
        doc = {k: v for k, v in t.items() if v is not None}
        for k in ["published_at", "submission_deadline", "opening_date"]:
            if isinstance(doc.get(k), datetime):
                doc[k] = doc[k].isoformat()
        bulk_body.append(doc)

    try:
        await os_client.bulk(body=bulk_body)
        print(f"  ✓ OpenSearch: {len(tenders)} documents indexed")
    except Exception as e:
        print(f"  Warning: OpenSearch bulk index: {e}")

    await os_client.close()


async def seed_qdrant(tenders: list):
    print(f"  Indexing {len(tenders)} tenders into Qdrant...")
    try:
        client = AsyncQdrantClient(url=QDRANT_URL)
        model = SentenceTransformer(EMBEDDING_MODEL)

        # Create collection
        try:
            await client.create_collection(
                collection_name="tenders",
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            print("  ✓ Qdrant collection 'tenders' created")
        except Exception:
            print("  ✓ Qdrant collection already exists")

        # Embed and upsert in batches
        batch_size = 50
        for i in range(0, len(tenders), batch_size):
            batch = tenders[i:i + batch_size]
            texts = [f"{t['title']} {t['ministry']} {t['department']} {t['ai_summary']}" for t in batch]
            embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
            points = [
                PointStruct(
                    id=str(t["id"]),
                    vector=emb.tolist(),
                    payload={
                        "tender_id": t["id"], "title": t["title"],
                        "ministry": t["ministry"], "department": t["department"],
                        "state": t["state"], "categories": t["categories"],
                        "estimated_cost_lakhs": t["estimated_cost_lakhs"],
                        "submission_deadline": (
                            t["submission_deadline"].isoformat()
                            if isinstance(t["submission_deadline"], datetime) else t["submission_deadline"]
                        ),
                        "status": t["status"],
                        "msme_eligible": t["msme_eligible"],
                        "ai_summary": t["ai_summary"],
                        "source": t["source_id"],
                    },
                )
                for t, emb in zip(batch, embeddings)
            ]
            await client.upsert(collection_name="tenders", points=points)
            print(f"  Qdrant: batch {i // batch_size + 1}/{(len(tenders) + batch_size - 1) // batch_size} upserted")

        print(f"  ✓ Qdrant: {len(tenders)} tenders indexed")
    except Exception as e:
        print(f"  Warning: Qdrant indexing failed: {e}")


async def main(count: int):
    print(f"\n{'='*60}")
    print(f"  TenderOS Seed Script — {count} tenders")
    print(f"{'='*60}\n")

    print(f"Generating {count} synthetic tenders...")
    tenders = [make_tender() for _ in range(count)]
    print(f"✓ Generated {len(tenders)} tenders\n")

    # PostgreSQL
    print("[1/3] Seeding PostgreSQL...")
    try:
        conn = await asyncpg.connect(PG_DSN)
        await seed_postgres(tenders, conn)
        await conn.close()
    except Exception as e:
        print(f"  ✗ PostgreSQL failed: {e}")

    # OpenSearch
    print("\n[2/3] Seeding OpenSearch...")
    try:
        await seed_opensearch(tenders)
    except Exception as e:
        print(f"  ✗ OpenSearch failed: {e}")

    # Qdrant
    print("\n[3/3] Seeding Qdrant...")
    try:
        await seed_qdrant(tenders)
    except Exception as e:
        print(f"  ✗ Qdrant failed: {e}")

    print(f"\n{'='*60}")
    print(f"  Seed complete! {count} tenders loaded.")
    print(f"  Dashboard: http://localhost:3000")
    print(f"  API:       http://localhost:8000")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=500, help="Number of tenders to generate")
    parser.add_argument("--env", type=str, default="dev", help="Environment")
    args = parser.parse_args()
    asyncio.run(main(args.count))
