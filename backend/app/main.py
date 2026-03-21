from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import admin

app = FastAPI(title="Secure AI Pipeline", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "secure-ai-pipeline"}
