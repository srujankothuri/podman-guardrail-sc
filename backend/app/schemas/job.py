from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobSubmitRequest(BaseModel):
    prompt: str

class JobSubmitResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    insufficient_data: bool = False
    message: Optional[str] = None
    answer: Optional[str] = None
    created_at: Optional[datetime] = None
