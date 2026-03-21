from fastapi import APIRouter, HTTPException
from app.schemas.job import JobStatusResponse
from app.services.queue_service import get_job

router = APIRouter(prefix="/api", tags=["jobs"])

@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(**job)
