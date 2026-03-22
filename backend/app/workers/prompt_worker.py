import os
from app.services.queue_service import get_job, update_job
from app.services.guardian_client import run_gg2, run_gg3
from app.services.retrieval import retrieve_chunks
from app.services.llm_client import generate_answer
from app.services.audit_logger import log_event
from app.services.policy_ingestion import load_active_policy
from app.services.rate_limiter import decrement_queue_count

MAX_RETRIEVAL_ATTEMPTS = 2

def process_job(job_id: str) -> None:
    job = get_job(job_id)
    if not job:
        return

    prompt   = job["prompt"]
    user_id  = job["user_id"]
    policy   = load_active_policy()
    rules    = [r.model_dump() for r in policy.rules] if policy else []
    policy_instruction = policy.global_instruction if policy else ""

    try:
        # ── Retrieval with GG2 ───────────────────────────────────────
        update_job(job_id, status="retrieving_knowledge")
        log_event("retrieval_started", job_id=job_id, user_id=user_id)

        chunks = retrieve_chunks(prompt, top_k=5)
        insufficient_data = False
        retrieval_attempts = 1

        gg2_result = run_gg2(prompt, chunks, job_id=job_id, user_id=user_id)

        if gg2_result["decision"] == "insufficient" and retrieval_attempts < MAX_RETRIEVAL_ATTEMPTS:
            retrieval_attempts = 2
            chunks = retrieve_chunks(prompt, top_k=10)
            gg2_result = run_gg2(prompt, chunks, job_id=job_id, user_id=user_id)

        if gg2_result["decision"] in ("insufficient", "error"):
            insufficient_data = True

        # ── LLM generation ───────────────────────────────────────────
        update_job(job_id, status="generating")
        log_event("llm_started", job_id=job_id, user_id=user_id)

        context = "\n\n".join(chunks) if chunks else "No relevant context found."
        llm_result = generate_answer(prompt, context, policy_instruction)

        if not llm_result["success"]:
            update_job(job_id,
                status="failed",
                message="Response generation failed. Please try again after some time."
            )
            log_event("llm_error", job_id=job_id, user_id=user_id,
                      details={"error": llm_result.get("error")})
            decrement_queue_count(user_id)
            return

        answer = llm_result["answer"]
        log_event("llm_completed", job_id=job_id, user_id=user_id)

        # ── GG3 output check ─────────────────────────────────────────
        update_job(job_id, status="validating")
        gg3_result = run_gg3(prompt, answer, rules, job_id=job_id, user_id=user_id)

        if gg3_result["decision"] == "block":
            update_job(job_id,
                status="blocked",
                message="A response could not be generated because the retrieved content did not meet company compliance requirements."
            )
            log_event("security_alert_created", job_id=job_id, user_id=user_id,
                      details={"reason": "GG3 blocked output"})
            decrement_queue_count(user_id)
            return

        # ── Deliver answer ───────────────────────────────────────────
        warning = None
        if insufficient_data:
            warning = "This response was generated with limited supporting data and may be incomplete."

        update_job(job_id,
            status="completed",
            answer=answer,
            insufficient_data=insufficient_data,
            message=warning
        )
        log_event("response_delivered", job_id=job_id, user_id=user_id,
                  details={"insufficient_data": insufficient_data})

    except Exception as e:
        update_job(job_id,
            status="failed",
            message="Response generation failed. Please try again after some time."
        )
        log_event("llm_error", job_id=job_id, user_id=user_id,
                  details={"error": str(e)})
    finally:
        decrement_queue_count(user_id)
