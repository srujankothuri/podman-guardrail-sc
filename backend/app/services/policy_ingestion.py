import json
import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path
from app.schemas.policy import CompliancePolicy, PolicyRule

POLICIES_DIR = Path(os.getenv("POLICIES_DIR", "./policies"))
ACTIVE_POLICY_PATH = POLICIES_DIR / "active" / "current_policy.json"
ARCHIVE_DIR = POLICIES_DIR / "archive"

SEVERITY_KEYWORDS = {
    "critical": ["password", "credential", "secret", "key", "ssn", "social security"],
    "high": ["salary", "compensation", "pii", "personal", "legal", "client", "confidential"],
    "medium": ["medical", "health", "disciplinary", "performance"],
    "low": ["professional", "respectful", "guidelines"]
}

ACTION_KEYWORDS = {
    "block": ["do not", "never", "must not", "prohibited", "forbidden"],
    "warn_or_block": ["avoid", "should not", "recommend against", "when in doubt"]
}

def _detect_severity(text: str) -> str:
    text_lower = text.lower()
    for severity, keywords in SEVERITY_KEYWORDS.items():
        if any(k in text_lower for k in keywords):
            return severity
    return "medium"

def _detect_action(text: str) -> str:
    text_lower = text.lower()
    for action, keywords in ACTION_KEYWORDS.items():
        if any(k in text_lower for k in keywords):
            return action
    return "warn_or_block"

def _detect_category(text: str) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["salary", "compensation", "bonus"]):
        return "sensitive_data"
    if any(k in text_lower for k in ["legal", "advice", "interpret"]):
        return "regulatory"
    if any(k in text_lower for k in ["pii", "personal", "ssn", "address"]):
        return "pii"
    if any(k in text_lower for k in ["password", "credential", "key"]):
        return "security"
    if any(k in text_lower for k in ["client", "contract", "business"]):
        return "confidentiality"
    return "general"

def parse_policy_text(text: str, uploaded_by: str = "hr_admin") -> CompliancePolicy:
    lines = text.strip().split("\n")
    rules = []
    rule_counter = 1

    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Skip headers and separators
        if line.startswith("=") or line.isupper():
            continue
        # Extract numbered rules
        import re
        match = re.match(r"^\d+\.\s+(.+)", line)
        if match:
            rule_text = match.group(1).strip()
            rule_id = f"R{rule_counter:03d}"
            rules.append(PolicyRule(
                id=rule_id,
                category=_detect_category(rule_text),
                severity=_detect_severity(rule_text),
                description=rule_text,
                action=_detect_action(rule_text),
                examples_block=[],
                examples_allow=[]
            ))
            rule_counter += 1

    source_hash = f"sha256:{hashlib.sha256(text.encode()).hexdigest()}"
    policy_version = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return CompliancePolicy(
        policy_version=policy_version,
        source_hash=source_hash,
        activated_at=datetime.now(timezone.utc),
        activated_by=uploaded_by,
        rules=rules,
        global_instruction="All responses must follow company policy and avoid disallowed disclosures."
    )

def save_policy(policy: CompliancePolicy) -> None:
    POLICIES_DIR.mkdir(parents=True, exist_ok=True)
    (POLICIES_DIR / "active").mkdir(exist_ok=True)
    ARCHIVE_DIR.mkdir(exist_ok=True)

    # Archive existing policy if present
    if ACTIVE_POLICY_PATH.exists():
        existing = json.loads(ACTIVE_POLICY_PATH.read_text())
        version = existing.get("policy_version", "unknown").replace(":", "-")
        archive_path = ARCHIVE_DIR / f"policy_{version}.json"
        archive_path.write_text(json.dumps(existing, indent=2))

    # Save new active policy
    ACTIVE_POLICY_PATH.write_text(policy.model_dump_json(indent=2))

def load_active_policy() -> CompliancePolicy | None:
    if not ACTIVE_POLICY_PATH.exists():
        return None
    data = json.loads(ACTIVE_POLICY_PATH.read_text())
    return CompliancePolicy(**data)
