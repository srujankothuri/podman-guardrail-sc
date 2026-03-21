# Secure AI Pipeline

Enterprise AI assistant with Granite Guardian guardrails.

## Stack
- **Guardrails**: Granite Guardian 3.3 8B (Ollama local)
- **LLM**: Granite 3.3 2B (Ollama local)
- **Backend**: Python FastAPI
- **Queue**: Redis + RQ
- **Vector DB**: Chroma
- **Runtime**: Rootless Podman

## Quick start
```bash
cp .env.example .env
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload
```
