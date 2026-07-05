"""Company Digital Twin routes."""
from fastapi import APIRouter, Request, UploadFile, File, Form
from app.proxy import ServiceProxy
from app.config import settings
import httpx

router = APIRouter()
_proxy = ServiceProxy(settings.DIGITAL_TWIN_SERVICE_URL)


@router.get("/profile", summary="Get company procurement profile")
async def get_profile(request: Request):
    user = request.state.user
    return await _proxy.get(f"/profile/{user['user_id']}")


@router.post("/profile", summary="Create or update company profile")
async def upsert_profile(request: Request):
    user = request.state.user
    body = await request.json()
    body["user_id"] = user["user_id"]
    return await _proxy.post("/profile", json=body)


@router.get("/profile/score", summary="Get profile completeness score")
async def get_profile_score(request: Request):
    user = request.state.user
    return await _proxy.get(f"/profile/{user['user_id']}/score")


@router.post("/documents", summary="Upload company document (GST, ISO, Experience cert, etc.)")
async def upload_document(request: Request):
    """
    Upload and auto-extract company documents.
    Supported: GST certificate, PAN, ISO certificates, MSME/Udyam,
    Experience certificates, Turnover certificates.
    """
    user = request.state.user
    form = await request.form()
    # Stream the file to digital-twin-service
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {"file": (form["file"].filename, await form["file"].read(), form["file"].content_type)}
        data = {"user_id": user["user_id"], "doc_type": form.get("doc_type", "other")}
        resp = await client.post(
            f"{settings.DIGITAL_TWIN_SERVICE_URL}/documents",
            files=files,
            data=data,
        )
    if resp.status_code >= 400:
        from fastapi import HTTPException
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


@router.get("/documents", summary="List uploaded company documents")
async def list_documents(request: Request):
    user = request.state.user
    return await _proxy.get("/documents", params={"user_id": user["user_id"]})


@router.delete("/documents/{doc_id}", summary="Delete a company document")
async def delete_document(request: Request, doc_id: str):
    user = request.state.user
    return await _proxy.delete(f"/documents/{doc_id}?user_id={user['user_id']}")
