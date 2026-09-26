export interface RepoFile {
  path: string;
  name: string;
  language: string;
  content: string;
}

export const REPOSITORY_FILES: RepoFile[] = [
  {
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    language: 'yaml',
    content: `version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
    networks:
      - trueforge-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://trueforge_admin:tf_secure_pass_2026@postgres-prod:5432/trueforge_prod
      - SANDBOX_DATABASE_URL=postgresql://trueforge_admin:tf_secure_pass_2026@postgres-sandbox:5432/trueforge_sandbox
      - GEMINI_API_KEY=\${GEMINI_API_KEY:-}
      - ENVIRONMENT=production
    depends_on:
      postgres-prod:
        condition: service_healthy
      postgres-sandbox:
        condition: service_healthy
    networks:
      - trueforge-network

  postgres-prod:
    image: postgres:16-alpine
    container_name: tf_postgres_prod
    environment:
      POSTGRES_USER: trueforge_admin
      POSTGRES_PASSWORD: tf_secure_pass_2026
      POSTGRES_DB: trueforge_prod
    ports:
      - "5432:5432"
    volumes:
      - prod_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02_seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U trueforge_admin -d trueforge_prod"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - trueforge-network

  postgres-sandbox:
    image: postgres:16-alpine
    container_name: tf_postgres_sandbox
    environment:
      POSTGRES_USER: trueforge_admin
      POSTGRES_PASSWORD: tf_secure_pass_2026
      POSTGRES_DB: trueforge_sandbox
    ports:
      - "5433:5432"
    volumes:
      - sandbox_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U trueforge_admin -d trueforge_sandbox"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - trueforge-network

volumes:
  prod_data:
  sandbox_data:

networks:
  trueforge-network:
    driver: bridge`
  },
  {
    path: 'backend/app/main.py',
    name: 'main.py',
    language: 'python',
    content: `import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models.schemas import MigrationSubmitRequest
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

PROD_URL = os.getenv("DATABASE_URL")
SANDBOX_URL = os.getenv("SANDBOX_DATABASE_URL")

tools = DatabaseTools(PROD_URL, SANDBOX_URL)
agent = DatabaseChangeSafetyAgent(tools)

@app.post("/api/migrations/validate")
async def submit_and_validate_migration(request: MigrationSubmitRequest):
    return await agent.validate_migration(
        migration_id=f"mig_{int(os.times().system * 1000)}",
        title=request.title,
        sql=request.sql,
        rollback_sql=request.rollback_sql or "",
    )

@app.post("/api/migrations/{migration_id}/approve")
def approve_production_migration(migration_id: str, operator_signature: str):
    """
    CRITICAL HUMAN APPROVAL GATE:
    Never executes automatically. Requires human operator explicit signature.
    """
    if not operator_signature or len(operator_signature.strip()) < 3:
        raise HTTPException(status_code=400, detail="Explicit operator signature required.")
    return tools.execute_production_migration(migration_id, operator_signature)`
  },
  {
    path: 'backend/app/agents/safety_agent.py',
    name: 'safety_agent.py',
    language: 'python',
    content: `import time
from typing import Dict, Any, List
from ..tools.db_tools import DatabaseTools

class DatabaseChangeSafetyAgent:
    def __init__(self, tools: DatabaseTools):
        self.tools = tools

    async def validate_migration(self, migration_id: str, title: str, sql: str, rollback_sql: str = ""):
        # Autonomous tool execution sequence:
        # 1. inspect_schema()
        # 2. create_sandbox()
        # 3. restore_database()
        # 4. capture_baseline()
        # 5. apply_migration()
        # 6. run_integrity_checks()
        # 7. calculate_risk()
        # 8. generate_report()
        # 9. request_approval()
        pass`
  },
  {
    path: 'database/schema.sql',
    name: 'schema.sql',
    language: 'sql',
    content: `-- TrueForge Production Database Schema
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    content: `# TrueForge — Database Change Safety Agent

> **"Agents That Act"** — Autonomous Database Migration Validation

TrueForge acts as an active safety verification layer between developers and production PostgreSQL databases. Rather than simply reviewing SQL syntax, TrueForge autonomously provisions an isolated sandbox replica, restores a copy of production data, applies proposed migrations, runs automated integrity checks, computes row-level deltas, and enforces human-in-the-loop approval before anything reaches production.

## Autonomous Tool Execution Pipeline:
1. inspect_schema()
2. create_sandbox()
3. restore_database()
4. capture_baseline()
5. apply_migration()
6. compare_schema()
7. compare_rows()
8. run_integrity_checks()
9. calculate_risk()
10. generate_report()
11. request_approval()
12. execute_production_migration() [Strict Human Gate]`
  },
  {
    path: 'docs/architecture.md',
    name: 'architecture.md',
    language: 'markdown',
    content: `# TrueForge System Architecture

## Overview
TrueForge separates database operations across three environments:
1. DEVELOPMENT: Where engineers draft and test feature branch migrations.
2. SANDBOX: Ephemeral PostgreSQL container dynamically provisioned for safe execution and verification.
3. PRODUCTION: Protected by immutable network boundaries and approval state machines. Direct agent writes are strictly prohibited.`
  },
  {
    path: 'docs/security.md',
    name: 'security.md',
    language: 'markdown',
    content: `# TrueForge Security Model

## Non-Negotiable Invariants:
1. Zero automated writes to production database.
2. No connection strings, passwords, or secrets exposed to LLM context windows.
3. Physical operator approval signature required for production rollout.
4. Ephemeral sandboxes execute with strict 15s statement timeouts.`
  },
  {
    path: 'docs/agent-workflow.md',
    name: 'agent-workflow.md',
    language: 'markdown',
    content: `# TrueForge Agent Workflow

[OBSERVE]
  └── inspect_schema(): Inspects table metadata and column types.

[PLAN]
  └── create_sandbox(): Ephemeral PostgreSQL instance.
  └── restore_database(): Clones production snapshot.

[ACT]
  └── capture_baseline(): Cryptographic checksums and row stats.
  └── apply_migration(): Executes SQL in sandbox.

[VERIFY]
  └── compare_schema(): Structural AST diff.
  └── compare_rows(): Delta on row counts and data.
  └── run_integrity_checks(): 6-point verification suite.

[REPORT & GATE]
  └── calculate_risk(): Synthesizes risk score and locks.
  └── generate_report(): Produces cryptographic report.
  └── execute_production_migration(): Requires human operator approval signature.`
  },
];
