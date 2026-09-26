# TrueForge Agent Workflow

```
[OBSERVE]
  └── inspect_schema(): Inspects table metadata, constraints, and current column types.

[PLAN]
  └── create_sandbox(): Launches an isolated ephemeral PostgreSQL instance.
  └── restore_database(): Populates sandbox with production snapshot data.

[ACT]
  └── capture_baseline(): Computes baseline row counts, checksums, null counts, and max lengths.
  └── apply_migration(): Executes the proposed migration SQL inside sandbox.

[VERIFY]
  └── compare_schema(): Compares baseline AST vs new AST.
  └── compare_rows(): Calculates delta on row counts and row data.
  └── run_integrity_checks(): Executes 6-point verification (Referential, Null, Unique, Truncation, Row, Constraint).

[REPORT]
  └── calculate_risk(): Synthesizes numerical risk score (0-100) and safety category.
  └── generate_report(): Generates cryptographic audit report.

[APPROVAL GATE]
  └── request_approval(): Alerts engineering leads and stops execution.
  └── execute_production_migration(): Requires physical human click and operator signature.
```
