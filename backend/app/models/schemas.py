from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class ApprovalStateEnum(str, Enum):
    PENDING = "PENDING"
    VALIDATING = "VALIDATING"
    SANDBOX_TESTING = "SANDBOX_TESTING"
    VALIDATION_COMPLETE = "VALIDATION_COMPLETE"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    PRODUCTION_EXECUTION = "PRODUCTION_EXECUTION"
    REJECTED = "REJECTED"
    FAILED = "FAILED"
    ROLLED_BACK = "ROLLED_BACK"

class RiskLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class MigrationSubmitRequest(BaseModel):
    title: str = Field(..., description="Short title describing migration intent")
    sql: str = Field(..., description="PostgreSQL DDL/DML migration statements")
    rollback_sql: Optional[str] = Field(None, description="Optional rollback script")
    operator: str = Field(default="Developer", description="Submitting engineer identity")

class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    default: Optional[str] = None

class TableBaseline(BaseModel):
    table_name: str
    row_count: int
    checksum: str
    null_counts: Dict[str, int]
    max_lengths: Dict[str, int]

class IntegrityCheckResult(BaseModel):
    id: str
    name: str
    category: str
    status: str # PASS, WARNING, FAIL
    summary: str
    offending_count: int = 0
    examples: List[Dict[str, Any]] = []
    recommendation: Optional[str] = None

class RiskReport(BaseModel):
    score: int
    level: RiskLevelEnum
    verdict: str
    summary: str
    recommendations: List[str]

class MigrationValidationReport(BaseModel):
    migration_id: str
    title: str
    sql: str
    rollback_sql: str
    approval_state: ApprovalStateEnum
    risk: RiskReport
    integrity_checks: List[IntegrityCheckResult]
    schema_diff: List[Dict[str, Any]]
    row_diffs: Dict[str, Any]
    timeline: List[Dict[str, Any]]
