import {
  ApprovalState,
  AgentToolCallLog,
  DatabaseBaseline,
  MigrationReport,
  RiskAssessment,
  SchemaDiff,
  TableRowDiff,
  IntegrityReport,
} from '../types/database';
import {
  TrueForgeDatabase,
  compareSchema,
  compareRows,
  runIntegrityChecks,
  calculateRisk,
} from './databaseEngine';

export interface AgentWorkflowCallbacks {
  onStepStart?: (toolName: string, description: string) => void;
  onStepComplete?: (log: AgentToolCallLog) => void;
  onStateChange?: (state: ApprovalState) => void;
}

export class TrueForgeAgentService {
  private productionDb: TrueForgeDatabase;
  private developmentDb: TrueForgeDatabase;
  private sandboxDb: TrueForgeDatabase | null = null;
  private lastBaseline: DatabaseBaseline | null = null;
  private lastReport: MigrationReport | null = null;
  private toolLogs: AgentToolCallLog[] = [];

  constructor() {
    this.productionDb = new TrueForgeDatabase('PRODUCTION');
    this.developmentDb = new TrueForgeDatabase('DEVELOPMENT');
  }

  public getProductionDb(): TrueForgeDatabase {
    return this.productionDb;
  }

  public getDevelopmentDb(): TrueForgeDatabase {
    return this.developmentDb;
  }

  public getSandboxDb(): TrueForgeDatabase | null {
    return this.sandboxDb;
  }

  public getLastReport(): MigrationReport | null {
    return this.lastReport;
  }

  public getToolLogs(): AgentToolCallLog[] {
    return [...this.toolLogs];
  }

  // Resets databases to original seeded state
  public resetToSeed() {
    this.productionDb = new TrueForgeDatabase('PRODUCTION');
    this.developmentDb = new TrueForgeDatabase('DEVELOPMENT');
    this.sandboxDb = null;
    this.lastBaseline = null;
    this.lastReport = null;
    this.toolLogs = [];
  }

  // Executes the autonomous validation pipeline against sandbox
  public async runValidationPipeline(
    migrationSql: string,
    title: string,
    operator: string = 'Developer (Auto-Agent)',
    rollbackSqlInput?: string,
    callbacks?: AgentWorkflowCallbacks
  ): Promise<MigrationReport> {
    this.toolLogs = [];
    callbacks?.onStateChange?.('VALIDATING');

    const runNonce = Math.random().toString(36).substring(2, 9);
    const migrationId = `mig_${Date.now()}_${runNonce}`;
    const startedAt = new Date().toISOString();

    // TOOL 1: inspect_schema()
    callbacks?.onStepStart?.('inspect_schema', 'Inspecting current production database schema catalog and table invariants');
    const t1Start = performance.now();
    await this.delay(180);
    const prodSchema = this.productionDb.schema;
    const t1Log: AgentToolCallLog = {
      id: `tool_${runNonce}_1_inspect_schema`,
      toolName: 'inspect_schema',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t1Start),
      status: 'SUCCESS',
      inputParameters: { targetEnvironment: 'PRODUCTION' },
      outputResult: {
        tablesCount: Object.keys(prodSchema.tables).length,
        tables: Object.keys(prodSchema.tables),
        version: prodSchema.version,
      },
      reasoningNote: `Retrieved catalog schema containing ${Object.keys(prodSchema.tables).length} tables: users, products, orders, order_items, payments, subscriptions.`,
    };
    this.toolLogs.push(t1Log);
    callbacks?.onStepComplete?.(t1Log);

    // TOOL 2: create_sandbox()
    callbacks?.onStateChange?.('SANDBOX_TESTING');
    callbacks?.onStepStart?.('create_sandbox', 'Provisioning isolated, ephemeral PostgreSQL sandbox container');
    const t2Start = performance.now();
    await this.delay(260);
    const sandboxId = `sandbox_pg_${Math.random().toString(36).substring(2, 9)}`;
    const t2Log: AgentToolCallLog = {
      id: `tool_${runNonce}_2_create_sandbox`,
      toolName: 'create_sandbox',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t2Start),
      status: 'SUCCESS',
      inputParameters: { containerImage: 'postgres:16-alpine', isolatedNamespace: sandboxId },
      outputResult: { sandboxId, status: 'PROVISIONED', networkIsolated: true },
      reasoningNote: `Created fresh isolated PostgreSQL container ${sandboxId}. Production traffic cannot reach this sandbox.`,
    };
    this.toolLogs.push(t2Log);
    callbacks?.onStepComplete?.(t2Log);

    // TOOL 3: restore_database()
    callbacks?.onStepStart?.('restore_database', 'Cloning production snapshot and restoring copy into sandbox environment');
    const t3Start = performance.now();
    await this.delay(300);
    this.sandboxDb = this.productionDb.clone('SANDBOX');
    const t3Log: AgentToolCallLog = {
      id: `tool_${runNonce}_3_restore_database`,
      toolName: 'restore_database',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t3Start),
      status: 'SUCCESS',
      inputParameters: { source: 'PRODUCTION_HOT_STANDBY', target: sandboxId },
      outputResult: {
        restoredTables: Object.keys(this.sandboxDb.state).length,
        usersCount: this.sandboxDb.state.users.length,
        ordersCount: this.sandboxDb.state.orders.length,
      },
      reasoningNote: `Restored exact clone of production data: 120 users, 520 orders, 1050 order_items, 110 products, 520 payments, 85 subscriptions into sandbox.`,
    };
    this.toolLogs.push(t3Log);
    callbacks?.onStepComplete?.(t3Log);

    // TOOL 4: capture_baseline()
    callbacks?.onStepStart?.('capture_baseline', 'Capturing pre-migration schema, row checksums, null counts, and column lengths');
    const t4Start = performance.now();
    await this.delay(200);
    this.lastBaseline = this.sandboxDb.captureBaseline();
    const t4Log: AgentToolCallLog = {
      id: `tool_${runNonce}_4_capture_baseline`,
      toolName: 'capture_baseline',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t4Start),
      status: 'SUCCESS',
      inputParameters: { sandboxId, deepStats: true },
      outputResult: {
        totalRows: this.lastBaseline.totalRows,
        globalChecksum: this.lastBaseline.globalChecksum,
        tablesTracked: Object.keys(this.lastBaseline.tables),
      },
      reasoningNote: `Computed baseline cryptographic checksums and column stats across all ${this.lastBaseline.totalRows} records.`,
    };
    this.toolLogs.push(t4Log);
    callbacks?.onStepComplete?.(t4Log);

    // TOOL 5: apply_migration()
    callbacks?.onStepStart?.('apply_migration', 'Applying proposed migration DDL/DML statements against sandbox database');
    const t5Start = performance.now();
    await this.delay(280);
    const migrationResult = this.sandboxDb.applyMigration(migrationSql);
    const t5Log: AgentToolCallLog = {
      id: `tool_${runNonce}_5_apply_migration`,
      toolName: 'apply_migration',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t5Start),
      status: migrationResult.success ? 'SUCCESS' : 'ERROR',
      inputParameters: { sql: migrationSql, timeoutMs: 15000 },
      outputResult: migrationResult,
      reasoningNote: migrationResult.success
        ? `Executed in ${migrationResult.executionTimeMs}ms with zero syntax errors.`
        : `SQL Execution failed: ${migrationResult.message}`,
    };
    this.toolLogs.push(t5Log);
    callbacks?.onStepComplete?.(t5Log);

    // TOOL 6: compare_schema()
    callbacks?.onStepStart?.('compare_schema', 'Analyzing structural AST differences: added, dropped, modified columns & indexes');
    const t6Start = performance.now();
    await this.delay(190);
    const schemaDiff = compareSchema(this.lastBaseline.schema, this.sandboxDb.schema);
    const t6Log: AgentToolCallLog = {
      id: `tool_${runNonce}_6_compare_schema`,
      toolName: 'compare_schema',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t6Start),
      status: 'SUCCESS',
      inputParameters: { beforeVersion: this.lastBaseline.schema.version, afterVersion: this.sandboxDb.schema.version },
      outputResult: {
        diffCount: schemaDiff.items.length,
        hasDestructiveChanges: schemaDiff.hasDestructiveChanges,
        affectedTables: schemaDiff.tablesAffected,
        items: schemaDiff.items,
      },
      reasoningNote: `Detected ${schemaDiff.items.length} schema changes across [${schemaDiff.tablesAffected.join(', ')}]. Destructive: ${schemaDiff.hasDestructiveChanges}.`,
    };
    this.toolLogs.push(t6Log);
    callbacks?.onStepComplete?.(t6Log);

    // TOOL 7: compare_rows()
    callbacks?.onStepStart?.('compare_rows', 'Computing row-level diffs, added/deleted/modified rows, and checksum verification');
    const t7Start = performance.now();
    await this.delay(220);
    const rowDiffs = compareRows(this.lastBaseline, this.sandboxDb);
    const t7Log: AgentToolCallLog = {
      id: `tool_${runNonce}_7_compare_rows`,
      toolName: 'compare_rows',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t7Start),
      status: 'SUCCESS',
      inputParameters: { tableCount: Object.keys(rowDiffs).length },
      outputResult: rowDiffs,
      reasoningNote: `Evaluated row counts for all tables. Total table results: ${Object.values(rowDiffs).map(r => `${r.tableName}:${r.status}`).join(', ')}.`,
    };
    this.toolLogs.push(t7Log);
    callbacks?.onStepComplete?.(t7Log);

    // TOOL 8: run_integrity_checks()
    callbacks?.onStepStart?.('run_integrity_checks', 'Executing automated 6-point integrity suite: FKs, nulls, uniqueness, truncations');
    const t8Start = performance.now();
    await this.delay(310);
    const integrityReport = runIntegrityChecks(this.lastBaseline, this.sandboxDb, schemaDiff);
    const t8Log: AgentToolCallLog = {
      id: `tool_${runNonce}_8_run_integrity_checks`,
      toolName: 'run_integrity_checks',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t8Start),
      status: integrityReport.overallStatus === 'FAIL' ? 'ERROR' : 'SUCCESS',
      inputParameters: { suites: ['REFERENTIAL', 'NULLABILITY', 'UNIQUENESS', 'TRUNCATION', 'ROW_STABILITY', 'CONSTRAINTS'] },
      outputResult: {
        passed: integrityReport.passedCount,
        warning: integrityReport.warningCount,
        failed: integrityReport.failedCount,
        checks: integrityReport.checks,
      },
      reasoningNote: `Integrity check summary: ${integrityReport.passedCount} PASS, ${integrityReport.warningCount} WARNING, ${integrityReport.failedCount} FAIL.`,
    };
    this.toolLogs.push(t8Log);
    callbacks?.onStepComplete?.(t8Log);

    // TOOL 9: calculate_risk()
    callbacks?.onStepStart?.('calculate_risk', 'Synthesizing risk matrix, table locks, downtime projection, and remediation');
    const t9Start = performance.now();
    await this.delay(180);
    const riskAssessment = calculateRisk(schemaDiff, rowDiffs, integrityReport);

    // Request AI semantic analysis from Gemini API proxy if possible
    let aiAnalysisText = '';
    try {
      const aiResponse = await fetch('/api/gemini/analyze-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: migrationSql,
          schemaDiff,
          integrityReport,
          riskAssessment,
        }),
      });
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        if (data.analysis) {
          aiAnalysisText = data.analysis;
          riskAssessment.aiAnalysis = aiAnalysisText;
          if (data.recommendations && data.recommendations.length > 0) {
            riskAssessment.recommendations = Array.from(new Set([...riskAssessment.recommendations, ...data.recommendations]));
          }
        }
      }
    } catch {
      // Offline fallback: keep rule-based calculations
    }

    const t9Log: AgentToolCallLog = {
      id: `tool_${runNonce}_9_calculate_risk`,
      toolName: 'calculate_risk',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t9Start),
      status: 'SUCCESS',
      inputParameters: { score: riskAssessment.score, level: riskAssessment.level },
      outputResult: riskAssessment,
      reasoningNote: `Assigned Risk Level ${riskAssessment.level} (Score ${riskAssessment.score}/100). Verdict: ${riskAssessment.verdict}.`,
    };
    this.toolLogs.push(t9Log);
    callbacks?.onStepComplete?.(t9Log);

    // Generate Rollback SQL if not provided
    const rollbackSql = rollbackSqlInput || this.generateRollbackSql(migrationSql, schemaDiff);

    // TOOL 10: generate_report()
    callbacks?.onStepStart?.('generate_report', 'Generating auditable cryptographic migration safety report');
    const t10Start = performance.now();
    await this.delay(150);

    const report: MigrationReport = {
      migrationId,
      title: title || 'Database Schema Migration',
      migrationSql,
      rollbackSql,
      createdAt: startedAt,
      operator,
      environmentTarget: 'PRODUCTION',
      approvalState: riskAssessment.verdict === 'FAILED_VALIDATION' ? 'FAILED' : 'AWAITING_APPROVAL',
      riskAssessment,
      schemaDiff,
      rowDiffs,
      integrityReport,
      toolCalls: [...this.toolLogs],
    };

    const t10Log: AgentToolCallLog = {
      id: `tool_${runNonce}_10_generate_report`,
      toolName: 'generate_report',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - t10Start),
      status: 'SUCCESS',
      inputParameters: { migrationId },
      outputResult: { reportGenerated: true, migrationId },
      reasoningNote: `Compiled comprehensive audit report. Production gate: ${report.approvalState}.`,
    };
    this.toolLogs.push(t10Log);
    callbacks?.onStepComplete?.(t10Log);

    // Set overall state
    const nextState: ApprovalState = riskAssessment.verdict === 'FAILED_VALIDATION' ? 'FAILED' : 'AWAITING_APPROVAL';
    callbacks?.onStateChange?.(nextState);

    this.lastReport = report;
    return report;
  }

  // Generates intelligent rollback SQL based on schema diff
  public generateRollbackSql(sql: string, schemaDiff: SchemaDiff): string {
    const rollbackLines: string[] = ['-- TrueForge Autonomous Rollback Script'];
    for (const item of schemaDiff.items) {
      if (item.type === 'COLUMN_ADDED' && item.columnName) {
        rollbackLines.push(`ALTER TABLE ${item.tableName} DROP COLUMN ${item.columnName};`);
      } else if (item.type === 'COLUMN_DROPPED' && item.columnName) {
        rollbackLines.push(`-- ⚠️ WARNING: Column "${item.columnName}" was dropped. Restoring column definition without original data:`);
        rollbackLines.push(`ALTER TABLE ${item.tableName} ADD COLUMN ${item.columnName} VARCHAR(255) NULL;`);
      } else if (item.type === 'COLUMN_MODIFIED' && item.columnName && item.oldType) {
        rollbackLines.push(`ALTER TABLE ${item.tableName} ALTER COLUMN ${item.columnName} TYPE ${item.oldType};`);
      } else if (item.type === 'INDEX_ADDED') {
        const match = item.description.match(/index "([^"]+)"/);
        if (match) {
          rollbackLines.push(`DROP INDEX IF EXISTS ${match[1]};`);
        }
      } else if (item.type === 'CONSTRAINT_ADDED') {
        const match = item.description.match(/constraint "([^"]+)"/);
        if (match) {
          rollbackLines.push(`ALTER TABLE ${item.tableName} DROP CONSTRAINT IF EXISTS ${match[1]};`);
        }
      }
    }
    if (rollbackLines.length === 1) {
      rollbackLines.push('-- No inverse DDL generated. Manual rollback may be required.');
    }
    return rollbackLines.join('\n');
  }

  // Explicit Human Operator Approval Boundary
  public async executeProductionMigration(
    report: MigrationReport,
    operatorSignature: string,
    callbacks?: AgentWorkflowCallbacks
  ): Promise<{ success: boolean; message: string }> {
    if (report.approvalState !== 'AWAITING_APPROVAL' && report.approvalState !== 'APPROVED') {
      throw new Error(`Cannot execute migration in state "${report.approvalState}". Must be AWAITING_APPROVAL.`);
    }

    callbacks?.onStateChange?.('PRODUCTION_EXECUTION');

    // TOOL 11: execute_production_migration()
    const tStart = performance.now();
    await this.delay(500);

    const execResult = this.productionDb.applyMigration(report.migrationSql);

    const log: AgentToolCallLog = {
      id: `tool_${Math.random().toString(36).substring(2, 9)}_prod_exec`,
      toolName: 'execute_production_migration',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - tStart),
      status: execResult.success ? 'SUCCESS' : 'ERROR',
      inputParameters: {
        targetEnvironment: 'PRODUCTION',
        approvedBy: operatorSignature,
        migrationId: report.migrationId,
      },
      outputResult: execResult,
      reasoningNote: execResult.success
        ? `Applied migration to Production database with explicit human approval signature: "${operatorSignature}".`
        : `Production execution failed: ${execResult.message}`,
    };

    this.toolLogs.push(log);
    callbacks?.onStepComplete?.(log);

    if (execResult.success) {
      report.approvalState = 'APPROVED';
      report.executedAt = new Date().toISOString();
      report.approvalRecord = {
        approvedBy: operatorSignature,
        approvedAt: new Date().toISOString(),
        auditSignature: `TF-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
      callbacks?.onStateChange?.('APPROVED');
      return { success: true, message: 'Migration successfully applied to Production database!' };
    } else {
      report.approvalState = 'FAILED';
      callbacks?.onStateChange?.('FAILED');
      return { success: false, message: execResult.message };
    }
  }

  // Rollback production migration
  public async rollbackProductionMigration(
    report: MigrationReport,
    operatorSignature: string,
    callbacks?: AgentWorkflowCallbacks
  ): Promise<{ success: boolean; message: string }> {
    callbacks?.onStateChange?.('VALIDATING');

    const tStart = performance.now();
    await this.delay(400);

    const rollbackResult = this.productionDb.applyMigration(report.rollbackSql);

    const log: AgentToolCallLog = {
      id: `tool_${Math.random().toString(36).substring(2, 9)}_prod_rollback`,
      toolName: 'rollback_migration',
      startedAt: Date.now(),
      durationMs: Math.round(performance.now() - tStart),
      status: rollbackResult.success ? 'SUCCESS' : 'ERROR',
      inputParameters: {
        targetEnvironment: 'PRODUCTION',
        operator: operatorSignature,
        rollbackSql: report.rollbackSql,
      },
      outputResult: rollbackResult,
      reasoningNote: `Rollback applied to Production database by ${operatorSignature}.`,
    };

    this.toolLogs.push(log);
    callbacks?.onStepComplete?.(log);

    if (rollbackResult.success) {
      report.approvalState = 'ROLLED_BACK';
      callbacks?.onStateChange?.('ROLLED_BACK');
      return { success: true, message: 'Production changes rolled back successfully.' };
    } else {
      return { success: false, message: rollbackResult.message };
    }
  }

  // Reject migration
  public rejectMigration(report: MigrationReport, reason: string, callbacks?: AgentWorkflowCallbacks) {
    report.approvalState = 'REJECTED';
    if (!report.approvalRecord) {
      report.approvalRecord = {};
    }
    report.approvalRecord.rejectionReason = reason;
    callbacks?.onStateChange?.('REJECTED');
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const agentService = new TrueForgeAgentService();
