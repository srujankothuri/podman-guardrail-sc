# GraniteShield

> A production-grade, local-first AI pipeline with multi-layer guardrails powered by IBM Granite Guardian — where every prompt in and every response out is automatically compliance-checked before anyone sees anything, with everything running entirely on your machine.

Built for the Red Hat **"Pods, Prompts & Prototypes"** hackathon hosted by The Open Accelerator, a Red Hat and IBM initiative.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)
![Podman](https://img.shields.io/badge/Runtime-Podman-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## The problem

Most AI pipelines have no safety net between the user and the model. A harmful prompt goes in, a harmful response comes out — and nobody knows it happened.

GraniteShield fixes that by inserting IBM Granite Guardian 3.3 8B as a compliance layer at three independent checkpoints on every single request. Even when one layer misses something, the next one catches it.

---

## How it works

Admins upload a plain text compliance document. That document instantly becomes an active enforcement layer. Every request then flows through:

```
User prompt
    │
    ▼
Checkpoint 1 — Input check
IBM Granite Guardian checks the prompt for violations
before it enters the queue. Blocked prompts never reach the LLM.
    │
    ▼
Vector retrieval
Relevant knowledge chunks fetched from ChromaDB
    │
    ▼
Checkpoint 2 — Retrieval check
Guardian validates context for relevance and sufficiency.
Retries once if insufficient. Proceeds with warning if still insufficient.
    │
    ▼
Local LLM generation
Granite 3.3 2B generates an answer from approved context
    │
    ▼
Checkpoint 3 — Output check
Guardian checks the generated response against compliance rules.
Blocked outputs never reach the user. Security alert created.
    │
    ▼
Answer delivered to user
```

If anything fails at any stage — the user gets a clean, friendly message. No harmful content slips through. No sensitive data leaks. Every Guardian decision is logged with a full audit trail.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      PUBLIC ZONE                         │
│                                                         │
│   [Browser]  ──►  [Frontend :5173]                      │
│                        │                                │
│                   [Backend API :8000]                   │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    INTERNAL ZONE                         │
│                                                         │
│   [Rate Limiter] ──► [Redis Queue]                      │
│                            │                            │
│                        [Worker]                         │
│                      ↙    │    ↘                        │
│                 Guardian  │  ChromaDB                   │
│                   GG1     │                             │
│                           ▼                             │
│                        Guardian                         │
│                          GG2                            │
│                           │                             │
│                     [Local LLM]                         │
│                     Granite 3.3 2B                      │
│                           │                             │
│                        Guardian                         │
│                          GG3                            │
│                           │                             │
│                    [Audit Logger]                       │
└─────────────────────────────────────────────────────────┘
```

---

## Stack

| Layer | Technology |
|---|---|
| Guardrails | IBM Granite Guardian 3.3 8B via Ollama |
| LLM | IBM Granite 3.3 2B via Ollama |
| Backend | Python 3.12 + FastAPI |
| Queue + Rate limiting | Redis 7 |
| Vector DB | ChromaDB (persistent) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Container runtime | Rootless Podman |

---

## Prerequisites

- **Podman** ≥ 4.0 with rootless mode enabled
- **Ollama** installed and running
- **Node.js** ≥ 20
- **Python** ≥ 3.12
- **Redis** (via Homebrew or container)

---

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/srujankothuri/podman-guardrail-sc
cd podman-guardrail-sc
```

### 2. Pull models

```bash
# Granite Guardian 3.3 8B — compliance guardrail (~4.5GB)
ollama pull hf.co/ibm-granite/granite-guardian-3.3-8b-GGUF

# Granite 3.3 2B — answer generation (~1.5GB)
ollama pull granite3.3:2b
```

### 3. Set up environment

```bash
cp .env.example .env
```

### 4. Start Redis

```bash
brew services start redis       # Mac
```

### 5. Start backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 6. Ingest sample knowledge

```bash
# In a new terminal, inside backend/ with venv activated
python3 ingest_sample.py
```

### 7. Start frontend

```bash
cd frontend
npm install
npm run dev
```

### 8. Open the app

| URL | Description |
|---|---|
| `http://localhost:5173/chat` | Employee chat interface |
| `http://localhost:5173/admin` | Admin — policy upload + audit log |
| `http://localhost:8000/docs` | Backend Swagger UI |
| `http://localhost:8000/health` | Health check |

---

## Run with Podman

```bash
# Verify rootless Podman is running
podman machine start
podman system connection list

# Build and start all services
podman compose up --build

# Ingest sample knowledge
podman exec secure-ai-pipeline-backend-1 python3 ingest_sample.py
```

> Uses Docker-compatible images and Compose syntax, but runs on rootless Podman engine.

---

## Project structure

```
graniteshield/
├── compose.yaml                    # Podman compose topology
├── .env.example                    # Environment variable template
│
├── backend/
│   ├── Containerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                 # FastAPI entrypoint
│       ├── api/
│       │   ├── prompts.py          # POST /api/prompts (GG1 runs here)
│       │   ├── jobs.py             # GET /api/jobs/{id}
│       │   └── admin.py            # Policy upload + audit endpoints
│       ├── services/
│       │   ├── guardian_client.py  # GG1, GG2, GG3 via Ollama
│       │   ├── policy_ingestion.py # Text → normalized JSON policy
│       │   ├── retrieval.py        # ChromaDB vector retrieval
│       │   ├── llm_client.py       # Granite 3.3 2B via Ollama
│       │   ├── rate_limiter.py     # Redis sliding window limiter
│       │   ├── queue_service.py    # Job queue + status tracking
│       │   └── audit_logger.py     # Structured JSONL event logger
│       └── workers/
│           └── prompt_worker.py    # Full pipeline orchestration
│
├── frontend/
│   ├── Containerfile
│   └── src/
│       ├── pages/
│       │   ├── ChatPage.tsx        # Chat UI with pipeline status steps
│       │   └── AdminPage.tsx       # Policy upload + audit log viewer
│       ├── components/
│       │   ├── StatusIndicator.tsx # Live pipeline progress
│       │   └── AuditTable.tsx      # Color-coded audit log table
│       └── hooks/
│           └── useJobPoller.ts     # Job status polling
│
├── policies/
│   ├── active/                     # Currently active policy JSON
│   ├── archive/                    # Previous policy versions
│   └── samples/
│       └── sample_hr_policy.txt    # Sample compliance document
│
└── docs/
    ├── demo-script.md              # Hackathon demo walkthrough
    └── project-bible.md            # Full technical reference
```

---

## API reference

### `POST /api/prompts`
Submit a prompt. GG1 runs synchronously before queuing.

```json
// Request
{ "prompt": "What is the leave policy?", "user_id": "employee-1" }

// Response 200 — queued
{ "job_id": "abc123", "status": "queued", "message": "Your request has been queued." }

// Response 400 — GG1 blocked
{ "detail": "Your prompt could not be processed under company compliance rules. Please rephrase and try again." }

// Response 429 — rate limited
{ "detail": "You are sending requests too quickly. Please wait a moment." }
```

### `GET /api/jobs/{job_id}`
Poll job status. Triggers worker on first poll.

```json
// Completed
{ "job_id": "abc123", "status": "completed", "answer": "...", "insufficient_data": false }

// GG3 blocked
{ "job_id": "abc123", "status": "blocked", "message": "A response could not be generated because the retrieved content did not meet compliance requirements." }
```

### `POST /api/admin/policy/upload`
Upload a `.txt` compliance document. Parsed and activated immediately.

### `GET /api/admin/policy/current`
Returns active policy version, rule count, and SHA256 hash.

### `GET /api/admin/audit/events`
Returns last 50 audit events in reverse chronological order.

---

## Audit log events

Every pipeline stage emits a structured event to `backend/logs/YYYY-MM-DD.jsonl`:

| Event | Meaning |
|---|---|
| `gg1_allowed` | Input passed — request proceeds to queue |
| `gg1_blocked` | Input blocked — user gets compliance nudge |
| `gg1_error` | Guardian timeout — logged as technical failure |
| `gg2_sufficient` | Retrieved context is relevant and complete |
| `gg2_insufficient` | Context insufficient — retry triggered |
| `llm_started` | LLM generation began |
| `llm_completed` | LLM returned answer |
| `gg3_allowed` | Output passed — answer delivered to user |
| `gg3_blocked` | Output blocked — security alert created |
| `security_alert_created` | Triggered on GG3 block for review team |
| `response_delivered` | Answer successfully shown to user |
| `rate_limit_blocked` | Request rejected before queue |

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `GUARDIAN_MODEL` | `hf.co/ibm-granite/granite-guardian-3.3-8b-GGUF` | Guardian model |
| `LLM_MODEL` | `granite3.3:2b` | Generation model |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | ChromaDB storage path |
| `POLICIES_DIR` | `./policies` | Policy files directory |
| `RATE_LIMIT_PER_MIN` | `10` | Max requests per user per minute |
| `MAX_QUEUED_JOBS` | `2` | Max concurrent jobs per user |
| `GG_TIMEOUT` | `20` | Guardian timeout (seconds) |
| `LLM_TIMEOUT` | `120` | LLM generation timeout (seconds) |

---

## What's next

- **Flexible inference backends** — choose local or API-based models per layer independently. Local guardrails with a cloud LLM? Everything air-gapped? The choice should be yours.
- **Streaming responses** — stream LLM tokens as they generate
- **WebSocket status** — real-time job updates instead of polling
- **Multi-tenant isolation** — per-org policy and rate limiting
- **Policy simulation mode** — test a new policy against historical prompts before activating

---

## Hackathon requirement mapping

| Requirement | Implementation |
|---|---|
| Rootless containers | Podman engine, rootless default connection |
| Local AI | Granite Guardian 3.3 8B + Granite 3.3 2B via Ollama |
| Input/output guardrails | GG1 (input) + GG3 (output) via Granite Guardian |
| Content filtering | Policy-based rejection at GG1 and GG3 |
| Audit logging | Structured JSONL for every pipeline stage |
| Rate limiting | Redis sliding window, before queue |
| Graceful adversarial handling | Friendly nudge messages, internal error logging |
| Network isolation | Public net (frontend + backend) / internal net (Redis + ChromaDB) |

---

## Team

Built at the Red Hat Boston office for the **"Pods, Prompts & Prototypes"** hackathon by The Open Accelerator.

- [Venkata Srujan Kothuri](https://github.com/srujankothuri)
- [Chethan Gowda](https://www.linkedin.com/in/chethangowdagt/)
- [Manoj Harridoss](https://www.linkedin.com/in/manoj-h-6953b5247/)
