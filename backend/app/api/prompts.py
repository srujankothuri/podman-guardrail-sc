from fastapi import APIRouter, Request, HTTPException
from app.schemas.prompt import PromptRequest
from app.schemas.job import JobSubmitResponse
from app.services.rate_limiter import check_rate_limit, increment_queue_count
from app.services.queue_service import create_job

router = APIRouter(prefix="/api", tags=["prompts"])

@router.post("/prompts", response_model=JobSubmitResponse)
async def submit_prompt(request: Request, body: PromptRequest):
    ip = request.client.host
    user_id = body.user_id

    allowed, message = check_rate_limit(user_id, ip)
    if not allowed:
        raise HTTPException(status_code=429, detail=message)

    job_id = create_job(body.prompt, user_id)
    increment_queue_count(user_id)

    return JobSubmitResponse(
        job_id=job_id,
        status="queued",
        message="Your request has been queued."
    )
