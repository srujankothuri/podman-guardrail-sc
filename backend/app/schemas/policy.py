from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PolicyRule(BaseModel):
    id: str
    category: str
    severity: str  # low, medium, high, critical
    description: str
    action: str    # block, warn_or_block
    examples_block: Optional[List[str]] = []
    examples_allow: Optional[List[str]] = []

class CompliancePolicy(BaseModel):
    policy_version: str
    source_hash: str
    activated_at: datetime
    activated_by: str
    rules: List[PolicyRule]
    global_instruction: str

class PolicyUploadResponse(BaseModel):
    success: bool
    policy_version: str
    rules_extracted: int
    message: str

class PolicyMetadata(BaseModel):
    policy_version: str
    activated_at: datetime
    activated_by: str
    rules_count: int
    source_hash: str
