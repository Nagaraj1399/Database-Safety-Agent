# 🛡️ TrueForge — Database Change Safety Agent

> **"Agents That Act"** — Autonomous Database Migration Validation

TrueForge acts as an active safety verification layer between developers and production PostgreSQL databases. Rather than simply reviewing SQL syntax, TrueForge autonomously provisions an isolated sandbox replica, restores a copy of production data, applies proposed migrations, runs automated integrity checks, computes row-level deltas, and enforces human-in-the-loop approval before anything reaches production.

---

## 🎯 The Real-World Problem

Database migrations in high-throughput production systems frequently cause:
- **Silent Data Truncation** (e.g. altering `VARCHAR(255)` to `VARCHAR(30)`)
- **Unintended Row Deletions** and cascading data loss
- **Lock Deadlocks & Downtime** (`AccessExclusiveLock` vs `ShareLock`)
- **Broken Foreign Keys** and orphan records
- **NULL Constraint Violations** on pre-existing records
- **Application Compatibility Breaks**

TrueForge answers: **"If we apply this migration to production right now, what could break?"**

---

## 🧠 Autonomous Agent Workflow

```text
                    ┌─────────────────────────┐
                    │ Developer submits       │
                    │ migration / schema DDL  │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ Database Change         │
                    │ Safety Agent            │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ inspect_schema()        │
                    │ Catalog & Invariants    │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ create_sandbox()        │
                    │ Ephemeral Docker PG     │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ restore_database()      │
                    │ Hot Copy into Sandbox   │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ capture_baseline()      │
                    │ Cryptographic Row Stats │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ apply_migration()       │
                    │ Sandbox Execution       │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ compare_schema()        │
                    │ Structural AST Diff     │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ compare_rows()          │
                    │ Pre vs Post Deltas      │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ run_integrity_checks()  │
                    │ 6-Point Verification    │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ calculate_risk()        │
                    │ Downtime & Lock Impact  │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ generate_report()       │
                    │ Cryptographic Audit     │
                    └───────────┬─────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │ 🔒 STRICT HUMAN APPROVAL REQUIRED   │
              │ Physical Operator Sign-off Gate     │
              └─────────────────┬───────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ execute_production()    │
                    │ Production Application  │
                    └─────────────────────────┘
```

---

## 🔐 Security Model & State Machine

TrueForge enforces strict environment separation:

```text
DEVELOPMENT (pg-dev)
     │
     ▼
SANDBOX (isolated ephemeral container)
     │
     ▼
PRODUCTION (pg-prod) ──► 🔒 ZERO AUTOMATED WRITES
```

### Approval State Transitions:
1. `PENDING`: Migration submitted; waiting for validation trigger.
2. `VALIDATING`: Inspecting schema and provisioning sandbox.
3. `SANDBOX_TESTING`: Executing migration in isolated sandbox.
4. `VALIDATION_COMPLETE`: Verification suite execution finished.
5. `AWAITING_APPROVAL`: Passed sandbox checks; waiting for human signature.
6. `APPROVED`: Human operator signed audit; executed on production.
7. `REJECTED`: Operator rejected migration due to detected risks.
8. `FAILED`: Critical truncation, broken keys, or row loss detected.
9. `ROLLED_BACK`: Emergency inverse DDL executed on production.

---

## 🧪 6-Point Automated Integrity Suite

1. **Referential Integrity & Foreign Keys**: Validates relationships across orders, order items, products, and users to guarantee zero orphan records.
2. **NOT NULL & Default Constraints**: Checks that newly constrained columns do not violate pre-existing rows without defaults.
3. **Uniqueness & Primary Key Invariants**: Scans candidate unique indexes for key collisions.
4. **Data Truncation & Type Compatibility**: Calculates actual maximum string lengths of existing records before column resizing to prevent data truncation.
5. **Row Stability & Zero Data Loss**: Verifies table-by-table checksums before and after migration to detect unintended row deletions.
6. **Constraint & Index Validity**: Evaluates index structures and locks (`CREATE INDEX CONCURRENTLY` recommendations).

---

## 🗄️ Realistic SaaS Schema & Seed Data

The database represents a production multi-tenant SaaS application with 6 core tables and realistic foreign keys:

- `users` (120 records, UUID, roles, authentication emails)
- `products` (110 records, SKUs, pricing, stock levels)
- `orders` (520 records, status, total amounts)
- `order_items` (1,050 records, unit prices, quantities)
- `payments` (520 records, transaction references, payment methods)
- `subscriptions` (85 records, plans, recurring billing dates)

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend / Agent API**: FastAPI / Express with Google GenAI SDK (`@google/genai`)
- **Database**: PostgreSQL 16
- **Sandbox Architecture**: Ephemeral Docker PostgreSQL container with isolated bridge networking

---

## 🚀 Quick Start with Docker

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Postgres Production**: `localhost:5432`
- **Postgres Sandbox**: `localhost:5433`

---

## 📋 Example Scenarios Included

1. **Safe Migration (PASS)**: `ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;`
2. **Truncation Risk (FAIL)**: `ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(30);`
3. **Destructive Change (FAIL / WARN)**: `ALTER TABLE users DROP COLUMN name;`
4. **Constraint Validation (PASS)**: `ALTER TABLE orders ADD CONSTRAINT orders_user_fk FOREIGN KEY (user_id) REFERENCES users(id);`
5. **Index Addition (PASS)**: `CREATE INDEX idx_users_email ON users(email);`
6. **Row Loss Anomaly (FAIL)**: `DELETE FROM orders WHERE status = 'cancelled';`
