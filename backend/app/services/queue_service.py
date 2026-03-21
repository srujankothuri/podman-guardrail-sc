import redis
import json
import uuid
import os
from datetime import datetime, timezone

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
r = redis.from_url(REDIS_URL, decode_responses=True)

def _job_key(job_id: str) -> str:
    return f"job:{job_id}"

def create_job(prompt: str, user_id: str) -> str:
    job_id = str(uuid.uuid4())
    job = {
        "job_id":          job_id,
        "prompt":          prompt,
        "user_id":         user_id,
        "status":          "queued",
        "insufficient_data": False,
        "message":         None,
        "answer":          None,
        "created_at":      datetime.now(timezone.utc).isoformat()
    }
    r.setex(_job_key(job_id), 3600, json.dumps(job))
    r.lpush("job_queue", job_id)
    return job_id

def get_job(job_id: str) -> dict | None:
    data = r.get(_job_key(job_id))
    return json.loads(data) if data else None

def update_job(job_id: str, **kwargs) -> None:
    data = r.get(_job_key(job_id))
    if not data:
        return
    job = json.loads(data)
    job.update(kwargs)
    r.setex(_job_key(job_id), 3600, json.dumps(job))
