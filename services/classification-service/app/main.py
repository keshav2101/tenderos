"""Classification service performing sector tagging on tender documents."""
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Classification Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


class ClassificationRequest(BaseModel):
    tender_id: str
    title: str
    description: str


# Predefined domain keywords for classification rules (Zero-Shot mock mapping)
CATEGORIES_MAPPING = {
    "IT & Software": ["software", "cloud", "security", "saas", "application", "database", "it support", "developer", "coding", "intelligence", "ai", "machine learning"],
    "Medical & Healthcare": ["hospital", "medical", "drug", "medicine", "surgical", "vaccine", "clinical", "health", "doctor", "nurse", "patient", "aiims"],
    "Civil & Construction": ["road", "bridge", "building", "construction", "civil", "concrete", "steel", "excavation", "highway", "cement", "painting"],
    "Consultancy & Professional Services": ["audit", "consultant", "advisory", "management", "financial", "legal", "compliance", "assessment", "training", "feasibility"]
}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "classification-service"}


@app.post("/classify/tender")
async def classify_tender(req: ClassificationRequest):
    logger.info("Classifying tender sector", tender_id=req.tender_id)

    combined_text = f"{req.title} {req.description}".lower()
    matched_categories = []

    for category, keywords in CATEGORIES_MAPPING.items():
        if any(kw in combined_text for kw in keywords):
            matched_categories.append(category)

    # Default category if no keywords match
    if not matched_categories:
        matched_categories.append("General Procurement")

    logger.info("Classification complete", tender_id=req.tender_id, categories=matched_categories)
    return {
        "tender_id": req.tender_id,
        "primary_category": matched_categories[0],
        "all_categories": matched_categories
    }
