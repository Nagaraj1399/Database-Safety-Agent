export type EnvironmentType = 'DEVELOPMENT' | 'SANDBOX' | 'PRODUCTION';

export type ApprovalState =
  | 'PENDING'
  | 'VALIDATING'
  | 'SANDBOX_TESTING'
  | 'VALIDATION_COMPLETE'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'PRODUCTION_EXECUTION'
  | 'REJECTED'
  | 'FAILED'
  | 'ROLLED_BACK';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string | null;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  isUnique?: boolean;
}

export interface IndexDefinition {
  name: string;
  tableName: string;
  columns: string[];
  isUnique: boolean;
}

export interface ConstraintDefinition {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  tableName: string;
  columns: string[];
  definition: string;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKey: string[];
  indexes: IndexDefinition[];
  constraints: ConstraintDefinition[];
}

export interface DatabaseSchema {
  tables: Record<string, TableDefinition>;
  version: string;
  capturedAt: string;
}

export interface TableBaseline {
  tableName: string;
  rowCount: number;
  checksum: string;
  nullCounts: Record<string, number>;
  distinctCounts: Record<string, number>;
  maxLengths: Record<string, number>;
  sampleRows: Record<string, any>[];
}

export interface DatabaseBaseline {
  capturedAt: string;
  environment: EnvironmentType;
  schema: DatabaseSchema;
  tables: Record<string, TableBaseline>;
  totalRows: number;
  globalChecksum: string;
}

export interface TableRowDiff {
  tableName: string;
  beforeRowCount: number;
  afterRowCount: number;
  rowsAdded: number;
  rowsRemoved: number;
  rowsModified: number;
  checksumBefore: string;
  checksumAfter: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  details?: string;
}

export interface SchemaDiffItem {
  type: 'COLUMN_ADDED' | 'COLUMN_DROPPED' | 'COLUMN_MODIFIED' | 'TABLE_ADDED' | 'TABLE_DROPPED' | 'INDEX_ADDED' | 'CONSTRAINT_ADDED';
  tableName: string;
  columnName?: string;
  oldType?: string;
  newType?: string;
  description: string;
  isDestructive: boolean;
  warning?: string;
}

export interface SchemaDiff {
  items: SchemaDiffItem[];
  hasDestructiveChanges: boolean;
  tablesAffected: string[];
}

export interface IntegrityCheckDetail {
  id: string;
  name: string;
  category: 'REFERENTIAL' | 'NULLABILITY' | 'UNIQUENESS' | 'TRUNCATION' | 'ROW_STABILITY' | 'CONSTRAINTS';
  status: 'PASS' | 'WARNING' | 'FAIL';
  summary: string;
  offendingCount: number;
  offendingExamples?: Record<string, any>[];
  recommendation?: string;
}

export interface IntegrityReport {
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  passedCount: number;
  warningCount: number;
  failedCount: number;
  checks: IntegrityCheckDetail[];
}

export interface AgentToolCallLog {
  id: string;
  toolName: string;
  startedAt: number;
  durationMs: number;
  status: 'RUNNING' | 'SUCCESS' | 'ERROR';
  inputParameters: Record<string, any>;
  outputResult?: Record<string, any>;
  error?: string;
  reasoningNote?: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  title: string;
  score: number; // 0 - 100
  summary: string;
  verdict: 'SAFE_TO_PROCEED' | 'NEEDS_REVIEW' | 'FAILED_VALIDATION';
  breakingChangeCount: number;
  downtimeRisk: 'NONE' | 'BRIEF_LOCK' | 'TABLE_REWRITE_LOCK' | 'LONG_LOCK';
  rollbackFeasibility: 'AUTOMATIC' | 'COMPLEX_MANUAL' | 'IRREVERSIBLE';
  recommendations: string[];
  aiAnalysis?: string;
}

export interface MigrationReport {
  migrationId: string;
  title: string;
  migrationSql: string;
  rollbackSql: string;
  createdAt: string;
  executedAt?: string;
  operator: string;
  environmentTarget: EnvironmentType;
  approvalState: ApprovalState;
  riskAssessment: RiskAssessment;
  schemaDiff: SchemaDiff;
  rowDiffs: Record<string, TableRowDiff>;
  integrityReport: IntegrityReport;
  toolCalls: AgentToolCallLog[];
  approvalRecord?: {
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    auditSignature?: string;
  };
}

export interface MigrationScenario {
  id: string;
  title: string;
  category: 'SAFE' | 'DANGEROUS' | 'DESTRUCTIVE' | 'CONSTRAINT' | 'INDEX' | 'ROW_LOSS';
  sql: string;
  rollbackSql: string;
  description: string;
  expectedOutcome: 'PASS' | 'WARNING' | 'FAIL';
}
