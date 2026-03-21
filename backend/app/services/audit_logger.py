import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

LOGS_DIR = Path(os.getenv("LOGS_DIR", "./logs"))

EVENT_TYPES = [
    "prompt_received",
    "rate_limit_blocked",
    "queue_enqueued",
    "gg1_allowed",
    "gg1_blocked",
    "gg1_error",
    "retrieval_started",
    "gg2_sufficient",
    "gg2_insufficient",
    "gg2_error",
    "llm_started",
    "llm_completed",
    "llm_timeout",
    "llm_error",
    "gg3_allowed",
    "gg3_blocked",
    "gg3_error",
    "response_delivered",
    "policy_uploaded",
    "policy_activated",
    "security_alert_created"
]

def log_event(
    event_type: str,
    job_id: str = None,
    user_id: str = None,
    ip: str = None,
    details: dict = None,
    policy_version: str = None
) -> None:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    event = {
        "event_id":       str(uuid.uuid4()),
        "event_type":     event_type,
        "job_id":         job_id,
        "user_id":        user_id,
        "ip":             ip,
        "policy_version": policy_version,
        "details":        details or {},
        "timestamp":      datetime.now(timezone.utc).isoformat()
    }

    log_file = LOGS_DIR / f"{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.jsonl"
    with open(log_file, "a") as f:
        f.write(json.dumps(event) + "\n")

def get_recent_events(limit: int = 50) -> list:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    events = []
    for log_file in sorted(LOGS_DIR.glob("*.jsonl"), reverse=True)[:3]:
        with open(log_file) as f:
            for line in f:
                try:
                    events.append(json.loads(line.strip()))
                except Exception:
                    continue
    return sorted(events, key=lambda x: x["timestamp"], reverse=True)[:limit]
