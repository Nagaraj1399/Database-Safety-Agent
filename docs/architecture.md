# TrueForge System Architecture

## Overview

TrueForge is an autonomous Database Change Safety Agent designed as an active verification and safety layer between software engineers and production relational databases (PostgreSQL).

```
                    ┌────────────────────────┐
                    │      Developer UI      │
                    │ (React + Vite + Tailw.)│
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │     TrueForge API      │
                    │  (FastAPI / Express)   │
                    └───────────┬────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
   │  LLM Agent  │       │ Isolated    │       │ Production  │
   │ Reasoning   │       │ Sandbox DB  │       │ Relational  │
   │ (Gemini AI) │       │ (Docker PG) │       │ DB (PG 16)  │
   └─────────────┘       └─────────────┘       └──────▲──────┘
                                                      │
                                                      │ (STRICT HUMAN GATE)
                                               [APPROVAL REQUIRED]
```

## Three Isolated Environments

1. **DEVELOPMENT**: Where engineers draft, modify, and test application feature branches.
2. **SANDBOX**: An isolated, ephemeral PostgreSQL replica provisioned dynamically by the agent. The agent applies DDL/DML, measures locks, scans truncation, checks foreign keys, and calculates checksums.
3. **PRODUCTION**: Protected by immutable network boundaries and access control. Direct agent writes are strictly blocked; only an operator signature through the Approval Gate can execute migrations.

## Automated Verification Suite

- **Cryptographic Baseline**: Pre-computed hashes across all tables.
- **Row Comparison Engine**: Detects unexpected additions, deletions, or column mutations.
- **6-Point Integrity Matrix**:
  1. Referential Integrity (Foreign key validation & orphan detection)
  2. Nullability Constraints (NOT NULL and default values)
  3. Uniqueness Constraints (Primary key and unique indexes)
  4. Data Truncation (Max length vs target VARCHAR width)
  5. Row Count Stability (Zero unintended row loss)
  6. Constraints & Indexes (Lock assessment and invalid index checks)
