from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import deployments

app = FastAPI(
    title="Terraform Demo Orchestrator",
    description="Self-service portal for Terraform-based demo deployments",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(deployments.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "terraform-demo-orchestrator"}
