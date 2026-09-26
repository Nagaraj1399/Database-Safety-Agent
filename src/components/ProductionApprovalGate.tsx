import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  Flame,
} from 'lucide-react';
import { MigrationReport, ApprovalState } from '../types/database';

interface ProductionApprovalGateProps {
  report: MigrationReport | null;
  onApproveProduction: (operatorSignature: string) => Promise<void>;
  onRejectMigration: (reason: string) => void;
  onRollbackProduction: (operatorSignature: string) => Promise<void>;
  approvalState: ApprovalState;
}

export const ProductionApprovalGate: React.FC<ProductionApprovalGateProps> = ({
  report,
  onApproveProduction,
  onRejectMigration,
  onRollbackProduction,
  approvalState,
}) => {
  const [operatorSignature, setOperatorSignature] = useState('Senior DBA / DevOps Lead');
  const [rejectionReason, setRejectionReason] = useState('Data truncation detected on email column');
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 text-center shadow-lg shadow-black/40">
        <Lock className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-300">Production Boundary Protected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Complete sandbox validation before requesting production deployment authorization.
        </p>
      </div>
    );
  }

  const isFailed = report.riskAssessment.verdict === 'FAILED_VALIDATION' || approvalState === 'FAILED';
  const isApproved = approvalState === 'APPROVED' || approvalState === 'PRODUCTION_EXECUTION';
  const isRolledBack = approvalState === 'ROLLED_BACK';
  const isRejected = approvalState === 'REJECTED';

  const handleApprove = async () => {
    if (!operatorSignature.trim()) return;
    setIsProcessing(true);
    try {
      await onApproveProduction(operatorSignature);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRollback = async () => {
    if (!operatorSignature.trim()) return;
    setIsProcessing(true);
    try {
      await onRollbackProduction(operatorSignature);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-900/60 bg-[#120f0d] overflow-hidden shadow-xl shadow-black/50">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-amber-800/60 bg-amber-950/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Production Approval Boundary</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-amber-300 font-semibold">Strict Human Gate</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Zero Automated Production Writes</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Warning callout */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-700/60 bg-amber-950/30 p-3.5 text-xs text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">
              Target: Production Relational Database Cluster (pg_cluster_prod)
            </p>
            <p className="text-slate-300 leading-relaxed font-sans">
              The AI Safety Agent validates and isolates changes in ephemeral sandboxes. Production database tables
              will <strong>NEVER</strong> be modified without explicit physical operator confirmation and cryptographic audit signature.
            </p>
          </div>
        </div>

        {/* Status Card based on approvalState */}
        {isApproved ? (
          <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Production Migration Executed & Verified</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {report.approvalRecord?.auditSignature || 'TF-SEC-VERIFIED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Operator</span>
                <span className="text-white">{report.approvalRecord?.approvedBy || operatorSignature}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Timestamp</span>
                <span className="text-slate-300">{report.executedAt ? new Date(report.executedAt).toLocaleTimeString() : 'Just now'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-sans">State</span>
                <span className="text-emerald-400 font-bold">APPROVED</span>
              </div>
            </div>

            {/* Rollback option */}
            <div className="border-t border-emerald-900/60 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Emergency rollback available if unforeseen anomalies arise.</span>
              <button
                onClick={handleRollback}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/80 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Rollback Production</span>
              </button>
            </div>
          </div>
        ) : isRolledBack ? (
          <div className="rounded-lg border border-orange-800 bg-orange-950/40 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-orange-300 font-bold text-sm">
              <RotateCcw className="h-5 w-5 text-orange-400" />
              <span>Production Changes Rolled Back Successfully</span>
            </div>
            <p className="text-slate-300">
              Inverse rollback SQL statements were executed. The production database schema has been restored to its previous state.
            </p>
          </div>
        ) : isRejected ? (
          <div className="rounded-lg border border-rose-800 bg-rose-950/40 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <XCircle className="h-5 w-5 text-rose-400" />
              <span>Migration Rejected by Operator</span>
            </div>
            <p className="text-slate-300">
              Reason: {report.approvalRecord?.rejectionReason || 'Migration failed safety criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Operator Signature Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-cyan-400" />
                Operator Sign-off & Audit Signature
              </label>
              <input
                type="text"
                value={operatorSignature}
                onChange={e => setOperatorSignature(e.target.value)}
                placeholder="e.g. Lead SRE / Lead DBA"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            {/* Validation summary banner */}
            <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Sandbox Verdict:</span>
                <span className={`font-bold ${isFailed ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {report.riskAssessment.verdict}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-slate-300">
                <span>Integrity: {report.integrityReport.passedCount}/{report.integrityReport.checks.length} checks</span>
                <span>·</span>
                <span>Risk Score: {report.riskAssessment.score}/100</span>
              </div>
            </div>

            {isFailed && (
              <div className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-xs text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-rose-400" />
                  Warning: Migration failed sandbox validation
                </p>
                <p className="text-slate-300">
                  Integrity issues (truncation, broken keys, or row loss) were detected. Production approval is blocked or strongly discouraged.
                </p>
              </div>
            )}

            {/* Reject Form toggle */}
            {isConfirmingReject ? (
              <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-3 space-y-2">
                <label className="text-xs font-semibold text-rose-200">Rejection Audit Reason:</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full rounded-md border border-rose-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsConfirmingReject(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onRejectMigration(rejectionReason)}
                    className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsConfirmingReject(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-800/80 bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject Migration</span>
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isProcessing || !operatorSignature.trim() || isFailed}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Executing in Production...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      <span>Approve & Execute Production Migration</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
