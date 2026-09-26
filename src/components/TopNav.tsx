import React from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  Lock,
  FileCode,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import { ApprovalState } from '../types/database';

interface TopNavProps {
  approvalState: ApprovalState;
  onOpenDbExplorer: () => void;
  onOpenRepoFiles: () => void;
  onExportReport: () => void;
  onResetDb: () => void;
  hasActiveReport: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  approvalState,
  onOpenDbExplorer,
  onOpenRepoFiles,
  onExportReport,
  onResetDb,
  hasActiveReport,
}) => {
  const getStateBadge = () => {
    switch (approvalState) {
      case 'PENDING':
        return { text: 'Awaiting Change', color: 'text-slate-400 bg-slate-800/80 border-slate-700', icon: Clock };
      case 'VALIDATING':
      case 'SANDBOX_TESTING':
        return { text: 'Validating in Sandbox', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60 animate-pulse', icon: Clock };
      case 'VALIDATION_COMPLETE':
        return { text: 'Sandbox Validated', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60', icon: CheckCircle2 };
      case 'AWAITING_APPROVAL':
        return { text: 'Human Approval Required', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60', icon: AlertTriangle };
      case 'APPROVED':
      case 'PRODUCTION_EXECUTION':
        return { text: 'Production Applied', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60', icon: CheckCircle2 };
      case 'REJECTED':
        return { text: 'Migration Rejected', color: 'text-rose-400 bg-rose-950/60 border-rose-800/60', icon: XCircle };
      case 'FAILED':
        return { text: 'Validation Failed', color: 'text-rose-400 bg-rose-950/60 border-rose-800/60', icon: XCircle };
      case 'ROLLED_BACK':
        return { text: 'Rolled Back', color: 'text-orange-400 bg-orange-950/60 border-orange-800/60', icon: RotateCcw };
      default:
        return { text: approvalState, color: 'text-slate-300 bg-slate-800 border-slate-700', icon: Clock };
    }
  };

  const stateInfo = getStateBadge();
  const StateIcon = stateInfo.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Logo & Product Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">TrueForge</span>
              <span className="text-xs text-slate-400 font-medium">Database Safety Agent</span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous PostgreSQL sandbox validation & human-in-the-loop gate</p>
          </div>
        </div>

        {/* Environment Invariant Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-slate-400">Dev</span>
            <span className="font-mono text-slate-300">pg-dev</span>
          </div>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 animate-pulse" />
            <span className="text-slate-400">Sandbox</span>
            <span className="font-mono text-cyan-300">isolated</span>
          </div>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5 rounded bg-slate-900/90 px-2 py-0.5 border border-slate-800">
            <Lock className="h-3 w-3 text-amber-400" />
            <span className="text-slate-400">Production</span>
            <span className="font-mono text-amber-300 font-semibold">WRITE-LOCKED</span>
          </div>
        </div>

        {/* State Machine Status & Top Actions */}
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${stateInfo.color}`}>
            <StateIcon className="h-3.5 w-3.5" />
            <span>{stateInfo.text}</span>
          </div>

          <button
            onClick={onOpenDbExplorer}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            title="Inspect tables and data in Dev, Sandbox, and Prod"
          >
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">DB Explorer</span>
          </button>

          <button
            onClick={onOpenRepoFiles}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            title="Inspect Docker Compose & FastAPI Backend files"
          >
            <FileCode className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Docker & API</span>
          </button>

          {hasActiveReport && (
            <button
              onClick={onExportReport}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
              title="Download Markdown / PDF audit report"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">Report</span>
            </button>
          )}

          <button
            onClick={onResetDb}
            className="flex items-center gap-1 rounded-md border border-slate-800 p-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            title="Reset databases to initial seeded baseline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
