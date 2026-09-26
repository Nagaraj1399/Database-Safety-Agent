import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Sparkles,
  Lock,
  ArrowRight,
  Download,
  Info,
} from 'lucide-react';
import { RiskAssessment, MigrationReport } from '../types/database';

interface RiskReportCardProps {
  assessment: RiskAssessment | null;
  report: MigrationReport | null;
  onDownloadReport: () => void;
}

export const RiskReportCard: React.FC<RiskReportCardProps> = ({
  assessment,
  report,
  onDownloadReport,
}) => {
  if (!assessment) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 text-center shadow-lg shadow-black/40">
        <Sparkles className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-300">Risk Assessment Pending</h3>
        <p className="text-xs text-slate-400 mt-1">
          The safety agent will calculate downtime risk, table locks, and data integrity scores after sandbox execution.
        </p>
      </div>
    );
  }

  const getVerdictStyle = () => {
    switch (assessment.verdict) {
      case 'SAFE_TO_PROCEED':
        return {
          bg: 'bg-emerald-950/40 border-emerald-800/80',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          title: 'text-emerald-300',
          icon: CheckCircle2,
          label: 'SAFE TO PROCEED',
        };
      case 'NEEDS_REVIEW':
        return {
          bg: 'bg-amber-950/40 border-amber-800/80',
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          title: 'text-amber-300',
          icon: AlertTriangle,
          label: 'NEEDS HUMAN REVIEW',
        };
      case 'FAILED_VALIDATION':
      default:
        return {
          bg: 'bg-rose-950/40 border-rose-800/80',
          badge: 'bg-rose-950 text-rose-300 border-rose-800',
          title: 'text-rose-300',
          icon: ShieldAlert,
          label: 'FAILED VALIDATION',
        };
    }
  };

  const style = getVerdictStyle();
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border ${style.bg} p-5 shadow-lg shadow-black/40 space-y-4`}>
      {/* Header & Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-slate-900 border border-slate-800">
            <Icon className={`h-6 w-6 ${style.title}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}>
                {style.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Risk Score: <strong className="text-white">{assessment.score}</strong>/100
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{assessment.title}</h2>
          </div>
        </div>

        <button
          onClick={onDownloadReport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-4 w-4 text-cyan-400" />
          <span>Export Audit Report</span>
        </button>
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
        {assessment.summary}
      </p>

      {/* Lock & Rollback Invariants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
            PostgreSQL Lock Risk
          </span>
          <span className="font-semibold text-white mt-1 block">
            {assessment.downtimeRisk === 'NONE'
              ? 'Zero Lock (Safe)'
              : assessment.downtimeRisk === 'TABLE_REWRITE_LOCK'
              ? 'AccessExclusiveLock'
              : 'Brief ShareLock'}
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
            Rollback Feasibility
          </span>
          <span className="font-semibold text-cyan-300 mt-1 block">
            {assessment.rollbackFeasibility}
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
            Breaking Invariants
          </span>
          <span className="font-semibold text-amber-300 mt-1 block">
            {assessment.breakingChangeCount} detected
          </span>
        </div>
      </div>

      {/* AI Semantic Rationale */}
      {assessment.aiAnalysis && (
        <div className="rounded-lg border border-cyan-900/50 bg-cyan-950/20 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>AI DBA Risk Rationale & Lock Analysis</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed whitespace-pre-line font-sans">
            {assessment.aiAnalysis}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            Actionable Production Guidelines & Remediation
          </span>
          <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
            {assessment.recommendations.map((rec, i) => (
              <li key={i} className="leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
