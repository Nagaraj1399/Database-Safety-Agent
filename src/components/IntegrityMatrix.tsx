import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Link,
  HelpCircle,
  FileQuestion,
  Maximize2,
  Layers,
  Flame,
} from 'lucide-react';
import { IntegrityReport, IntegrityCheckDetail } from '../types/database';

interface IntegrityMatrixProps {
  report: IntegrityReport | null;
}

export const IntegrityMatrix: React.FC<IntegrityMatrixProps> = ({ report }) => {
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 text-center shadow-lg shadow-black/40">
        <ShieldCheck className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-300">Integrity Suite Pending</h3>
        <p className="text-xs text-slate-400 mt-1">
          Automated integrity verification executes against sandbox after migration execution.
        </p>
      </div>
    );
  }

  const getCheckIcon = (category: string) => {
    switch (category) {
      case 'REFERENTIAL':
        return Link;
      case 'NULLABILITY':
        return HelpCircle;
      case 'UNIQUENESS':
        return Layers;
      case 'TRUNCATION':
        return Flame;
      case 'ROW_STABILITY':
        return Maximize2;
      case 'CONSTRAINTS':
        return ShieldCheck;
      default:
        return ShieldCheck;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-lg shadow-black/40">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#10182b] px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">6-Point Automated Integrity Suite</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{report.passedCount} Passed</span>
          </span>
          {report.warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{report.warningCount} Warnings</span>
            </span>
          )}
          {report.failedCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <XCircle className="h-3.5 w-3.5" />
              <span>{report.failedCount} Failed</span>
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-800/70">
        {report.checks.map(check => {
          const Icon = getCheckIcon(check.category);
          const isExpanded = expandedCheckId === check.id;
          const isFail = check.status === 'FAIL';
          const isWarning = check.status === 'WARNING';

          return (
            <div
              key={check.id}
              className={`transition-colors ${
                isFail
                  ? 'bg-rose-950/20'
                  : isWarning
                  ? 'bg-amber-950/10'
                  : 'hover:bg-slate-900/40'
              }`}
            >
              <div
                onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                className="flex items-center justify-between p-3.5 cursor-pointer select-none"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-lg p-1.5 ${
                      isFail
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                        : isWarning
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{check.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                        {check.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-300 leading-normal">{check.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isFail ? (
                    <span className="rounded bg-rose-950 border border-rose-800 px-2 py-0.5 text-[11px] font-bold text-rose-300 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> FAIL
                    </span>
                  ) : isWarning ? (
                    <span className="rounded bg-amber-950 border border-amber-800 px-2 py-0.5 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> WARN
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> PASS
                    </span>
                  )}

                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Expandable Offending Records & Recommendations */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/80 p-4 text-xs space-y-3">
                  {check.recommendation && (
                    <div className="rounded-lg border border-cyan-900/60 bg-cyan-950/30 p-2.5 text-cyan-200">
                      <span className="font-semibold text-white">Recommended Remediation: </span>
                      <span>{check.recommendation}</span>
                    </div>
                  )}

                  {check.offendingExamples && check.offendingExamples.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[11px] font-semibold text-rose-300 uppercase">
                          Offending Record Evidence ({check.offendingCount} detected)
                        </span>
                        <span className="text-[11px] text-slate-400">Sample of first {check.offendingExamples.length}</span>
                      </div>
                      <div className="overflow-x-auto rounded border border-rose-950/80 bg-black/60 p-2 font-mono text-[11px] text-rose-200 max-h-40">
                        <pre>{JSON.stringify(check.offendingExamples, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {!check.recommendation && (!check.offendingExamples || check.offendingExamples.length === 0) && (
                    <p className="text-slate-400 text-xs">
                      Zero violations or anomalies detected for this check. The database state satisfies all relational and schema invariants.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
