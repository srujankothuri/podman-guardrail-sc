from fastapi import APIRouter, Request, HTTPException
from app.schemas.prompt import PromptRequest
from app.schemas.job import JobSubmitResponse
from app.services.rate_limiter import check_rate_limit, increment_queue_count
from app.services.queue_service import create_job
from app.services.guardian_client import run_gg1
from app.services.policy_ingestion import load_active_policy

router = APIRouter(prefix="/api", tags=["prompts"])

@router.post("/prompts", response_model=JobSubmitResponse)
async def submit_prompt(request: Request, body: PromptRequest):
    ip = request.client.host
    user_id = body.user_id

    allowed, message = check_rate_limit(user_id, ip)
    if not allowed:
        raise HTTPException(status_code=429, detail=message)

    policy = load_active_policy()
    rules = [r.model_dump() for r in policy.rules] if policy else []

    gg1_result = run_gg1(
        prompt=body.prompt,
        policy_rules=rules,
        job_id=None,
        user_id=user_id
    )

    if gg1_result["decision"] in ("block", "error"):
        raise HTTPException(
            status_code=400,
            detail="Your prompt could not be processed under company compliance rules. Please rephrase and try again."
        )

    job_id = create_job(body.prompt, user_id)
    increment_queue_count(user_id)

    return JobSubmitResponse(
        job_id=job_id,
        status="queued",
        message="Your request has been queued."
    )
