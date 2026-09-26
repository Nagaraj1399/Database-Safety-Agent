import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from .models.schemas import MigrationSubmitRequest, ApprovalStateEnum
from .tools.db_tools import DatabaseTools
from .agents.safety_agent import DatabaseChangeSafetyAgent

app = FastAPI(
    title="TrueForge Database Change Safety Agent API",
    description="Autonomous safety layer for PostgreSQL migrations with sandbox validation and human approval gates.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROD_URL = os.getenv("DATABASE_URL", "postgresql://trueforge_admin:tf_secure_pass_2026@localhost:5432/trueforge_prod")
SANDBOX_URL = os.getenv("SANDBOX_DATABASE_URL", "postgresql://trueforge_admin:tf_secure_pass_2026@localhost:5433/trueforge_sandbox")

tools = DatabaseTools(PROD_URL, SANDBOX_URL)
agent = DatabaseChangeSafetyAgent(tools)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "TrueForge Safety Agent"}

@app.post("/api/migrations/validate")
async def submit_and_validate_migration(request: MigrationSubmitRequest):
    migration_id = f"mig_{int(os.times().system * 1000)}"
    result = await agent.validate_migration(
        migration_id=migration_id,
        title=request.title,
        sql=request.sql,
        rollback_sql=request.rollback_sql or "",
    )
    return result

@app.post("/api/migrations/{migration_id}/approve")
def approve_production_migration(migration_id: str, operator_signature: str):
    """
    CRITICAL HUMAN APPROVAL GATE:
    Never executes automatically. Requires human operator explicit signature.
    """
    if not operator_signature or len(operator_signature.strip()) < 3:
        raise HTTPException(status_code=400, detail="Explicit operator signature required.")
    
    result = tools.execute_production_migration(migration_id, operator_signature)
    return {"message": "Production migration executed successfully", "audit": result}

@app.post("/api/migrations/{migration_id}/rollback")
def rollback_production_migration(migration_id: str, operator_signature: str):
    if not operator_signature:
        raise HTTPException(status_code=400, detail="Operator signature required for rollback.")
    result = tools.rollback_migration(migration_id, operator_signature)
    return {"message": "Rollback completed", "audit": result}
