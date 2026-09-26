import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Play,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Download,
  RotateCcw,
  Sparkles,
  GitCompare,
  Terminal,
} from 'lucide-react';
import { TopNav } from './components/TopNav';
import { MigrationEditor } from './components/MigrationEditor';
import { AgentTimeline } from './components/AgentTimeline';
import { SchemaDiffView } from './components/SchemaDiffView';
import { RowComparisonView } from './components/RowComparisonView';
import { IntegrityMatrix } from './components/IntegrityMatrix';
import { RiskReportCard } from './components/RiskReportCard';
import { ProductionApprovalGate } from './components/ProductionApprovalGate';
import { DatabaseExplorerModal } from './components/DatabaseExplorerModal';
import { ProjectExportModal } from './components/ProjectExportModal';
import { agentService } from './services/agentEngine';
import { MigrationReport, ApprovalState, AgentToolCallLog } from './types/database';
import { downloadReportAsFile } from './services/reportExport';
import { DEMO_SCENARIOS } from './services/scenarioData';

export default function App() {
  const [approvalState, setApprovalState] = useState<ApprovalState>('PENDING');
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [toolLogs, setToolLogs] = useState<AgentToolCallLog[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [currentStepName, setCurrentStepName] = useState<string>('');
  const [isDbExplorerOpen, setIsDbExplorerOpen] = useState<boolean>(false);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'diff' | 'rows' | 'integrity'>('overview');

  // Trigger an initial safe run on first load to showcase the dashboard immediately
  const hasInitializedRef = React.useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    const scenario = DEMO_SCENARIOS[0];
    handleRunValidation(scenario.sql, scenario.title, scenario.rollbackSql);
  }, []);

  const handleRunValidation = async (sql: string, title: string, rollbackSql?: string) => {
    if (isValidating) return;
    setIsValidating(true);
    setApprovalState('VALIDATING');
    setToolLogs([]);

    try {
      const resultReport = await agentService.runValidationPipeline(
        sql,
        title,
        'Developer (Auto-Agent)',
        rollbackSql,
        {
          onStepStart: (toolName, desc) => {
            setCurrentStepName(desc);
          },
          onStepComplete: (log) => {
            setToolLogs(agentService.getToolLogs());
          },
          onStateChange: (state) => {
            setApprovalState(state);
          },
        }
      );
      setReport(resultReport);
      setToolLogs(resultReport.toolCalls);
      setApprovalState(resultReport.approvalState);
    } catch (err: any) {
      console.error('Validation pipeline error:', err);
      setApprovalState('FAILED');
    } finally {
      setIsValidating(false);
      setCurrentStepName('');
    }
  };

  const handleApproveProduction = async (operatorSignature: string) => {
    if (!report) return;
    const res = await agentService.executeProductionMigration(report, operatorSignature, {
      onStateChange: (state) => setApprovalState(state),
      onStepComplete: () => setToolLogs(agentService.getToolLogs()),
    });
    if (res.success) {
      setReport({ ...report });
    }
  };

  const handleRejectMigration = (reason: string) => {
    if (!report) return;
    agentService.rejectMigration(report, reason, {
      onStateChange: (state) => setApprovalState(state),
    });
    setReport({ ...report });
  };

  const handleRollbackProduction = async (operatorSignature: string) => {
    if (!report) return;
    const res = await agentService.rollbackProductionMigration(report, operatorSignature, {
      onStateChange: (state) => setApprovalState(state),
      onStepComplete: () => setToolLogs(agentService.getToolLogs()),
    });
    if (res.success) {
      setReport({ ...report });
    }
  };

  const handleResetDatabases = () => {
    agentService.resetToSeed();
    setReport(null);
    setToolLogs([]);
    setApprovalState('PENDING');
  };

  const handleExportReport = () => {
    if (report) {
      downloadReportAsFile(report);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <TopNav
        approvalState={approvalState}
        onOpenDbExplorer={() => setIsDbExplorerOpen(true)}
        onOpenRepoFiles={() => setIsRepoModalOpen(true)}
        onExportReport={handleExportReport}
        onResetDb={handleResetDatabases}
        hasActiveReport={Boolean(report)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Hero Control Plane Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                PostgreSQL Change Verification Layer
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">v1.0 Production Ready</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              Autonomous Database Migration Safety Agent
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Validates proposed schema migrations in isolated sandbox environments, checks data integrity across 6 SaaS tables, and guarantees zero unapproved writes to production.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                Protected Records
              </span>
              <span className="font-bold text-white text-sm mt-0.5 block tabular-nums">2,405</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                Schema Tables
              </span>
              <span className="font-bold text-cyan-300 text-sm mt-0.5 block tabular-nums">6</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                Direct Prod Writes
              </span>
              <span className="font-bold text-emerald-400 text-sm mt-0.5 block">0 (BLOCKED)</span>
            </div>
          </div>
        </div>

        {/* Top Grid: Migration Editor & Agent Execution Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <MigrationEditor onRunValidation={handleRunValidation} isValidating={isValidating} />
            <AgentTimeline
              toolLogs={toolLogs}
              isValidating={isValidating}
              currentStepName={currentStepName}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            {/* Risk Assessment Card */}
            <RiskReportCard
              assessment={report ? report.riskAssessment : null}
              report={report}
              onDownloadReport={handleExportReport}
            />

            {/* Production Approval Gate */}
            <ProductionApprovalGate
              report={report}
              onApproveProduction={handleApproveProduction}
              onRejectMigration={handleRejectMigration}
              onRollbackProduction={handleRollbackProduction}
              approvalState={approvalState}
            />
          </div>
        </div>

        {/* Verification Engine Tabs & Results Area */}
        <div className="space-y-4 pt-2">
          {/* Section Heading & View Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Automated Verification Engines</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deep evidence inspection: schema mutations, row deltas, and automated constraints
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Checks ({report ? report.integrityReport.checks.length : 6})
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                  activeTab === 'diff'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Schema Diff ({report ? report.schemaDiff.items.length : 0})
              </button>
              <button
                onClick={() => setActiveTab('rows')}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                  activeTab === 'rows'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Row Diff (6 Tables)
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IntegrityMatrix report={report ? report.integrityReport : null} />
              <div className="space-y-6">
                <SchemaDiffView diff={report ? report.schemaDiff : null} />
                <RowComparisonView rowDiffs={report ? report.rowDiffs : null} />
              </div>
            </div>
          )}

          {activeTab === 'diff' && (
            <SchemaDiffView diff={report ? report.schemaDiff : null} />
          )}

          {activeTab === 'rows' && (
            <RowComparisonView rowDiffs={report ? report.rowDiffs : null} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">TrueForge</span>
            <span>·</span>
            <span>Autonomous PostgreSQL Change Safety</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Dockerized Sandboxes</span>
            <span>·</span>
            <span>Cryptographic Row Checksums</span>
            <span>·</span>
            <span>Human Approval Gate Invariant</span>
          </div>
        </div>
      </footer>

      {/* Database Explorer Modal */}
      <DatabaseExplorerModal
        isOpen={isDbExplorerOpen}
        onClose={() => setIsDbExplorerOpen(false)}
        prodDb={agentService.getProductionDb()}
        sandboxDb={agentService.getSandboxDb()}
        devDb={agentService.getDevelopmentDb()}
      />

      {/* Project Deliverable Code Explorer Modal */}
      <ProjectExportModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
      />
    </div>
  );
}
