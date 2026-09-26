import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  Database,
  Search,
  Cpu,
  ShieldCheck,
  FileText,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { AgentToolCallLog } from '../types/database';

interface AgentTimelineProps {
  toolLogs: AgentToolCallLog[];
  isValidating: boolean;
  currentStepName?: string;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  toolLogs,
  isValidating,
  currentStepName,
}) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'inspect_schema':
        return Search;
      case 'create_sandbox':
        return Layers;
      case 'restore_database':
        return Database;
      case 'capture_baseline':
        return Activity;
      case 'apply_migration':
        return Terminal;
      case 'compare_schema':
        return Search;
      case 'compare_rows':
        return Cpu;
      case 'run_integrity_checks':
        return ShieldCheck;
      case 'calculate_risk':
        return AlertTriangle;
      case 'generate_report':
        return FileText;
      case 'execute_production_migration':
        return Database;
      case 'rollback_migration':
        return Activity;
      default:
        return Terminal;
    }
  };

  const getFriendlyToolName = (toolName: string) => {
    const map: Record<string, string> = {
      inspect_schema: 'Inspect Current Schema & Invariants',
      create_sandbox: 'Provision Ephemeral Docker Sandbox',
      restore_database: 'Restore Production Data Copy into Sandbox',
      capture_baseline: 'Capture Cryptographic Baseline & Row Stats',
      apply_migration: 'Execute Migration in Isolated Sandbox',
      compare_schema: 'Analyze Schema AST Diff & Mutations',
      compare_rows: 'Calculate Row Diffs & Table Checksums',
      run_integrity_checks: 'Execute 6-Point Automated Integrity Suite',
      calculate_risk: 'Synthesize Risk Score & Downtime Impact',
      generate_report: 'Compile Cryptographic Safety Audit Report',
      execute_production_migration: 'Apply Changes to Production (Authorized)',
      rollback_migration: 'Execute Inverse Rollback on Production',
    };
    return map[toolName] || toolName;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-lg shadow-black/40">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#10182b] px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Autonomous Agent Execution</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-cyan-400 font-semibold">{toolLogs.length}</span>
          <span>tools executed</span>
          {isValidating && (
            <span className="flex items-center gap-1 text-cyan-400 animate-pulse font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Running: {currentStepName || 'Sandbox tests'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {toolLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-300">Agent Standing By</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Click "Validate in Isolated Sandbox" to trigger autonomous schema inspection, sandbox restore, execution, and verification.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {toolLogs.map((log, index) => {
              const Icon = getToolIcon(log.toolName);
              const isExpanded = expandedLogId === log.id;
              const isError = log.status === 'ERROR';

              return (
                <div
                  key={`${log.id || log.toolName}_${index}`}
                  className={`rounded-lg border transition-all ${
                    isError
                      ? 'border-rose-900/60 bg-rose-950/20'
                      : isExpanded
                      ? 'border-slate-700 bg-slate-900/80'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex items-center justify-between p-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-mono font-semibold ${
                          isError
                            ? 'bg-rose-900/50 text-rose-300'
                            : 'bg-slate-800 text-cyan-400'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isError ? 'text-rose-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-semibold text-white">
                          {getFriendlyToolName(log.toolName)}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {log.toolName}()
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isError ? (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Flagged Issue</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Verified</span>
                        </div>
                      )}

                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {log.durationMs}ms
                      </span>

                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Summary note */}
                  {log.reasoningNote && !isExpanded && (
                    <div className="px-3 pb-2 pt-0.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-600">↳</span>
                      <span className="truncate">{log.reasoningNote}</span>
                    </div>
                  )}

                  {/* Expandable tool payload inspector */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-black/40 p-3 text-xs space-y-2.5">
                      {log.reasoningNote && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Agent Rationale & Findings</span>
                          <p className="mt-0.5 text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800">
                            {log.reasoningNote}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Input Parameters</span>
                          <pre className="mt-1 max-h-36 overflow-auto rounded bg-slate-950 p-2 font-mono text-[11px] text-cyan-300 border border-slate-800/80">
                            {JSON.stringify(log.inputParameters, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Output Payload</span>
                          <pre className="mt-1 max-h-36 overflow-auto rounded bg-slate-950 p-2 font-mono text-[11px] text-emerald-300 border border-slate-800/80">
                            {JSON.stringify(log.outputResult, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
