"""High-speed generator for 9,000+ realistic Indian Government Tenders."""

from datetime import datetime, timedelta
import random

CATEGORIES = [
    "AI", "Cybersecurity", "Healthcare", "IT", "Drone", "Construction",
    "Renewable Energy", "Cloud", "IoT", "Data Analytics", "Medical Equipment",
    "Smart City", "GIS", "Education", "Defence", "Railways", "Power", "Oil & Gas"
]

MINISTRIES = [
    "Ministry of Electronics and Information Technology",
    "Ministry of Health and Family Welfare",
    "Ministry of Defence",
    "Ministry of Railways",
    "Ministry of Housing and Urban Affairs",
    "Ministry of Agriculture and Farmers Welfare",
    "Ministry of Education",
    "Ministry of Power",
    "Ministry of Finance",
    "Ministry of Home Affairs",
    "Ministry of Petroleum and Natural Gas",
    "Ministry of New and Renewable Energy",
    "Ministry of Road Transport and Highways",
    "Public Works Department"
]

ORGANISATIONS = [
    "Government e-Marketplace (GeM)", "National Informatics Centre (NIC)",
    "Defence Research and Development Organisation (DRDO)",
    "Hindustan Aeronautics Limited (HAL)", "Bharat Electronics Limited (BEL)",
    "Oil and Natural Gas Corporation (ONGC)", "Bharat Heavy Electricals Limited (BHEL)",
    "NTPC Limited", "Indian Oil Corporation (IOCL)", "AIIMS New Delhi",
    "IIT Bombay", "Delhi Metro Rail Corporation (DMRC)", "Brihanmumbai Municipal Corporation (BMC)",
    "BBMP Bengaluru", "GAIL (India) Limited", "Hindustan Petroleum (HPCL)",
    "Maharashtra PWD", "Uttar Pradesh PWD", "Karnataka PWD", "Tamil Nadu PWD",
    "Indian Railways", "IREDA / SECI", "C-DAC", "STQC", "NeGD"
]

STATES = [
    "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat",
    "Uttar Pradesh", "West Bengal", "Rajasthan", "Andhra Pradesh", "Telangana",
    "Kerala", "Haryana", "Punjab", "Bihar", "Madhya Pradesh", "Odisha",
    "Assam", "Jharkhand", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh"
]

SOURCES = ["GeM", "CPPP", "IREPS", "Defence", "HAL", "BEL", "ONGC", "BHEL", "NTPC", "IOCL", "State PWD", "Municipal Corporation"]

TITLES_BY_CAT = {
    "AI": ["Enterprise AI Chatbot & RAG Engine", "AI-based Fraud Detection System", "Machine Learning Smart City Platform", "AI Edge Analytics for Surveillance"],
    "Cybersecurity": ["24/7 Managed CSOC Setup", "SIEM/SOAR Deployment & Penetration Testing", "Cyber Forensics Lab & STQC Audit", "Network Firewall Upgrade"],
    "Healthcare": ["Hospital Information Management System", "Telemedicine Platform", "High-End MRI & CT Scanner Procurement", "EHR System Implementation"],
    "IT": ["Cloud Data Center Migration", "ERP Implementation", "Network Infrastructure & Wi-Fi Expansion", "Hardware Server Refresh"],
    "Drone": ["Autonomous VTOL Surveillance Drone Fleet", "Drone-based Land Records Survey", "Agricultural Spraying Drone Fleet", "Traffic Patrol Drones"],
    "Construction": ["6-Lane Elevated Expressway Corridor", "Government Complex Building", "Bridge Widening & Asphalt Paving", "Smart City Civil Infra"],
    "Renewable Energy": ["Supply & Installation of 500kW Solar PV Systems", "100MW BESS Integration", "Rooftop Solar for Govt Buildings", "Green Hydrogen Unit"],
    "Cloud": ["Cloud Infrastructure Managed Services", "Disaster Recovery DRaaS Setup", "Multi-Cloud Security Assessment", "DevOps Pipeline Platform"],
    "IoT": ["Smart Track Inspection IoT Sensors", "Smart LED Streetlighting & ICCC", "Water Quality Monitoring Network", "SCADA Gas Pipeline Telemetry"],
    "Data Analytics": ["Big Data Analytics Platform", "Predictive Maintenance Engine", "Open Data Portal Development", "Citizen Grievance Analytics"],
    "Medical Equipment": ["3T Digital MRI Scanner Procurement", "Robotic Surgical Systems", "ICU Ventilators & Patient Monitors", "Dialysis Machines Batch"],
    "Smart City": ["Integrated Command and Control Centre (ICCC)", "Smart Traffic Management System", "Automated Waste Processing Bio-CNG Plant", "Digital Signage"],
    "GIS": ["GIS Land Record Mapping", "Urban Planning Spatial Database", "Satellite Imagery Analytics", "Property Tax GIS Integration"],
    "Education": ["High Performance GPU Supercomputer Cluster", "Smart Classrooms & LMS Setup", "Online Examination Platform", "Digital Library Portal"],
    "Defence": ["Precision Avionics & Titanium Assemblies", "Radar Signal Processing & SDR Radios", "Tactical Body Armor & Night Vision", "Border Security Grid"],
    "Railways": ["Smart Railway Track Inspection System", "Metro AFC Gate QR/NCMC Upgrade", "Locomotive Safety System (Kavach)", "Signal & Telecom Upgrade"],
    "Power": ["Ultra-Supercritical Boiler Tubes Supply", "Substation Automation SCADA", "Smart Metering Infrastructure (AMI)", "Transmission Tower Line"],
    "Oil & Gas": ["Offshore Rig & Subsea Pipeline Inspection", "Cross-Country Gas Pipeline SCADA", "Refinery Process Automation CSOC", "LNG Terminal Maintenance"]
}

PROC_METHODS = ["Open Tender", "QCBS", "L1"]

def generate_catalog_tenders(count: int = 9763) -> list[dict]:
    """Generate deterministic, rich Indian procurement tender catalog."""
    rnd = random.Random(2026)
    now = datetime(2026, 8, 1, 10, 0, 0)
    tenders = []

    # Include curated 20 baseline tenders first
    for i in range(1, count + 1):
        cat = rnd.choice(CATEGORIES)
        titles = TITLES_BY_CAT.get(cat, ["Procurement of Technical Equipment & Services"])
        title = rnd.choice(titles)
        if count > 100 and i > 20:
            title += f" — Phase {(i % 5) + 1}"

        minst = rnd.choice(MINISTRIES)
        org = rnd.choice(ORGANISATIONS)
        st = rnd.choice(STATES)
        src = rnd.choice(SOURCES)
        cost = round(rnd.choices([rnd.uniform(10.0, 100.0), rnd.uniform(100.0, 1000.0), rnd.uniform(1000.0, 15000.0)], weights=[0.4, 0.4, 0.2])[0], 2)
        msme = rnd.random() < 0.60
        startup = rnd.random() < 0.35
        published = now - timedelta(days=rnd.randint(1, 90))
        deadline = published + timedelta(days=rnd.randint(14, 90))

        tid = f"tos-2026-{i:05d}"
        t = {
            "id": tid,
            "title": title,
            "ministry": minst,
            "department": f"{minst} Division {(i % 12) + 1}",
            "organisation": org,
            "state": st,
            "categories": list(set([cat, rnd.choice(CATEGORIES)])),
            "estimated_cost_lakhs": cost,
            "emd_lakhs": round(cost * 0.02, 2) if not msme else 0.0,
            "submission_deadline": deadline.isoformat(),
            "status": "active",
            "source": src,
            "msme_eligible": msme,
            "startup_eligible": startup,
            "source_url": f"https://eprocure.gov.in/tenders/{tid}",
            "source_tender_id": f"TOS/2026/B/{i:05d}",
            "ai_summary": f"Procurement of {title} by {org} under {minst} ({st}). MSME EMD exemption: {msme}. Submissions open until {deadline.strftime('%d %b %Y')}.",
            "published_at": published.isoformat(),
            "procurement_method": rnd.choice(PROC_METHODS),
        }
        tenders.append(t)

    return tenders
