import requests
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL       = os.getenv("LLM_MODEL", "granite3.3:2b")
LLM_TIMEOUT     = int(os.getenv("LLM_TIMEOUT", "120"))
OLLAMA_CHAT_URL = f"{OLLAMA_BASE_URL}/api/chat"

def generate_answer(prompt: str, context: str, policy_instruction: str = "") -> dict:
    system = f"""You are a helpful company HR assistant. Answer the employee's question
using only the provided context. Be concise and accurate.
{policy_instruction}
If the context does not contain enough information, say so clearly."""

    user_message = f"""Context:
{context}

Question: {prompt}"""

    try:
        res = requests.post(
            OLLAMA_CHAT_URL,
            json={
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user_message}
                ],
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 512}
            },
            timeout=LLM_TIMEOUT
        )
        res.raise_for_status()
        answer = res.json()["message"]["content"]
        return {"success": True, "answer": answer}
    except requests.exceptions.Timeout:
        return {"success": False, "error": "timeout"}
    except Exception as e:
        return {"success": False, "error": str(e)}
