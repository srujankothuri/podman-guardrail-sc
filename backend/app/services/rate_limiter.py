import redis
import os
import time

REDIS_URL      = os.getenv("REDIS_URL", "redis://localhost:6379")
RATE_PER_MIN   = int(os.getenv("RATE_LIMIT_PER_MIN", "10"))
BURST_LIMIT    = int(os.getenv("RATE_LIMIT_BURST", "3"))
MAX_QUEUED     = int(os.getenv("MAX_QUEUED_JOBS", "2"))

r = redis.from_url(REDIS_URL, decode_responses=True)

def _key_user(user_id: str) -> str:
    return f"ratelimit:user:{user_id}"

def _key_ip(ip: str) -> str:
    return f"ratelimit:ip:{ip}"

def _key_queue(user_id: str) -> str:
    return f"queuecount:user:{user_id}"

def check_rate_limit(user_id: str, ip: str) -> tuple[bool, str]:
    now = int(time.time())
    window = 60

    # Per user sliding window
    user_key = _key_user(user_id)
    r.zremrangebyscore(user_key, 0, now - window)
    user_count = r.zcard(user_key)
    if user_count >= RATE_PER_MIN:
        return False, "You are sending requests too quickly. Please wait a moment and try again."

    # Per IP sliding window
    ip_key = _key_ip(ip)
    r.zremrangebyscore(ip_key, 0, now - window)
    ip_count = r.zcard(ip_key)
    if ip_count >= 50:
        return False, "Too many requests from your network. Please try again later."

    # Max queued jobs per user
    queue_count = int(r.get(_key_queue(user_id)) or 0)
    if queue_count >= MAX_QUEUED:
        return False, "You already have requests in progress. Please wait for them to complete."

    # All checks passed — record this request
    r.zadd(user_key, {str(now): now})
    r.expire(user_key, window)
    r.zadd(ip_key, {str(now): now})
    r.expire(ip_key, window)

    return True, ""

def increment_queue_count(user_id: str) -> None:
    r.incr(_key_queue(user_id))
    r.expire(_key_queue(user_id), 300)

def decrement_queue_count(user_id: str) -> None:
    count = int(r.get(_key_queue(user_id)) or 0)
    if count > 0:
        r.decr(_key_queue(user_id))
