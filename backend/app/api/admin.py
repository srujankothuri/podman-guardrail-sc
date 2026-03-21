from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.policy_ingestion import parse_policy_text, save_policy, load_active_policy
from app.schemas.policy import PolicyUploadResponse, PolicyMetadata

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/policy/upload", response_model=PolicyUploadResponse)
async def upload_policy(file: UploadFile = File(...)):
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")

    content = await file.read()
    text = content.decode("utf-8")

    if len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="File is empty or too short")

    policy = parse_policy_text(text, uploaded_by="hr_admin")
    save_policy(policy)

    return PolicyUploadResponse(
        success=True,
        policy_version=policy.policy_version,
        rules_extracted=len(policy.rules),
        message=f"Policy activated with {len(policy.rules)} rules."
    )

@router.get("/policy/current", response_model=PolicyMetadata)
def get_current_policy():
    policy = load_active_policy()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found")
    return PolicyMetadata(
        policy_version=policy.policy_version,
        activated_at=policy.activated_at,
        activated_by=policy.activated_by,
        rules_count=len(policy.rules),
        source_hash=policy.source_hash
    )


from app.services.audit_logger import get_recent_events

@router.get("/audit/events")
def get_audit_events(limit: int = 50):
    return {"events": get_recent_events(limit)}
