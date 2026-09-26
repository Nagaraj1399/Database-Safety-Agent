import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import { TableRowDiff } from '../types/database';

interface RowComparisonViewProps {
  rowDiffs: Record<string, TableRowDiff> | null;
}

export const RowComparisonView: React.FC<RowComparisonViewProps> = ({ rowDiffs }) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  if (!rowDiffs || Object.keys(rowDiffs).length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 text-center shadow-lg shadow-black/40">
        <Database className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-300">No Row Comparisons Available</h3>
        <p className="text-xs text-slate-400 mt-1">
          Execute sandbox validation to compare table rows before and after migration execution.
        </p>
      </div>
    );
  }

  const diffList = Object.values(rowDiffs);
  const totalBefore = diffList.reduce((acc, curr) => acc + curr.beforeRowCount, 0);
  const totalAfter = diffList.reduce((acc, curr) => acc + curr.afterRowCount, 0);
  const hasRowLoss = diffList.some(d => d.rowsRemoved > 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-lg shadow-black/40">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#10182b] px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Row Comparison Engine</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-300 tabular-nums">{totalBefore}</span>
          <span className="text-slate-500">→</span>
          <span className="font-mono text-cyan-400 font-semibold tabular-nums">{totalAfter} rows</span>
          {hasRowLoss ? (
            <span className="rounded bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
              ROW DISCREPANCY DETECTED
            </span>
          ) : (
            <span className="rounded bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              ROWS 100% STABLE
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/60 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-2.5">Table</th>
              <th className="px-3 py-2.5 text-right">Before</th>
              <th className="px-3 py-2.5 text-right">After</th>
              <th className="px-3 py-2.5 text-right">Added</th>
              <th className="px-3 py-2.5 text-right">Removed</th>
              <th className="px-3 py-2.5 text-right">Modified</th>
              <th className="px-3 py-2.5">Checksum (Pre/Post)</th>
              <th className="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {diffList.map(diff => {
              const isSelected = selectedTable === diff.tableName;
              const isFail = diff.status === 'FAIL';
              const isWarning = diff.status === 'WARNING';

              return (
                <React.Fragment key={diff.tableName}>
                  <tr
                    onClick={() => setSelectedTable(isSelected ? null : diff.tableName)}
                    className={`cursor-pointer transition-colors ${
                      isFail
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : isSelected
                        ? 'bg-slate-900/90'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-1.5">
                      {isSelected ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      <span>{diff.tableName}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-300 tabular-nums">
                      {diff.beforeRowCount}
                    </td>
                    <td className="px-3 py-3 text-right text-white font-medium tabular-nums">
                      {diff.afterRowCount}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-400 tabular-nums">
                      {diff.rowsAdded > 0 ? `+${diff.rowsAdded}` : '0'}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {diff.rowsRemoved > 0 ? (
                        <span className="font-bold text-rose-400">-{diff.rowsRemoved}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-300 tabular-nums">
                      {diff.rowsModified > 0 ? diff.rowsModified : '0'}
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-[11px]">
                      <span className="text-slate-400">{diff.checksumBefore}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className={diff.checksumBefore !== diff.checksumAfter ? 'text-cyan-400 font-semibold' : 'text-slate-400'}>
                        {diff.checksumAfter}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isFail ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-950 border border-rose-800 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                          <XCircle className="h-3 w-3" /> FAIL
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-950 border border-amber-800 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> WARN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> PASS
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Expandable row detail */}
                  {isSelected && (
                    <tr className="bg-slate-950/90 font-sans">
                      <td colSpan={8} className="px-6 py-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-cyan-400" />
                            <span className="font-semibold text-slate-200">Table Findings:</span>
                            <span className="text-slate-400">{diff.details}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>Pre-checksum: {diff.checksumBefore}</span>
                            <span>·</span>
                            <span>Post-checksum: {diff.checksumAfter}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
