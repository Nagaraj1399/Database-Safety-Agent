import React from 'react';
import { GitCompare, Plus, Minus, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { SchemaDiff } from '../types/database';

interface SchemaDiffViewProps {
  diff: SchemaDiff | null;
}

export const SchemaDiffView: React.FC<SchemaDiffViewProps> = ({ diff }) => {
  if (!diff || diff.items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5 text-center shadow-lg shadow-black/40">
        <GitCompare className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-slate-300">No Schema Modifications Detected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Proposed statements do not alter table definitions, or validation has not been run yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-lg shadow-black/40">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#10182b] px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Schema Diff Engine</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-cyan-400 font-semibold">{diff.items.length}</span>
          <span className="text-slate-400">mutation(s)</span>
          {diff.hasDestructiveChanges ? (
            <span className="rounded bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
              DESTRUCTIVE CHANGE
            </span>
          ) : (
            <span className="rounded bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              NON-BREAKING
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 font-mono">
        {diff.items.map((item, index) => {
          if (item.type === 'COLUMN_ADDED') {
            return (
              <div
                key={index}
                className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>{item.tableName}</span>
                    <span className="text-slate-500 font-normal">/</span>
                    <span className="text-white">+{item.columnName}</span>
                    <span className="text-emerald-400 text-[11px]">{item.newType}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-sans font-medium">Added Column</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 font-sans pl-5.5">
                  {item.description}
                </p>
              </div>
            );
          }

          if (item.type === 'COLUMN_DROPPED') {
            return (
              <div
                key={index}
                className="rounded-lg border border-rose-900/80 bg-rose-950/30 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold">
                    <Minus className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>{item.tableName}</span>
                    <span className="text-slate-500 font-normal">/</span>
                    <span className="text-rose-200 line-through">-{item.columnName}</span>
                  </div>
                  <span className="text-[10px] bg-rose-900/60 border border-rose-700/60 px-1.5 py-0.5 rounded text-rose-200 uppercase tracking-wider font-sans font-bold">
                    Destructive Drop
                  </span>
                </div>
                {item.warning && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-rose-300 font-sans pl-5.5 bg-rose-950/60 p-2 rounded border border-rose-900/60">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400 mt-0.5" />
                    <span>{item.warning}</span>
                  </div>
                )}
              </div>
            );
          }

          if (item.type === 'COLUMN_MODIFIED') {
            return (
              <div
                key={index}
                className="rounded-lg border border-amber-900/80 bg-amber-950/20 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <GitCompare className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span>{item.tableName}.{item.columnName}</span>
                    <span className="text-slate-400 text-[11px]">{item.oldType}</span>
                    <span className="text-amber-400">→</span>
                    <span className="text-white text-[11px] underline decoration-amber-500">{item.newType}</span>
                  </div>
                  {item.isDestructive ? (
                    <span className="text-[10px] bg-amber-900/60 border border-amber-700/60 px-1.5 py-0.5 rounded text-amber-200 uppercase tracking-wider font-sans font-bold">
                      Truncation Hazard
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider font-sans font-medium">Type Alteration</span>
                  )}
                </div>
                {item.warning && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-200 font-sans pl-5.5 bg-amber-950/60 p-2 rounded border border-amber-900/60">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                    <span>{item.warning}</span>
                  </div>
                )}
              </div>
            );
          }

          // Default for index / constraint / table
          return (
            <div
              key={index}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{item.description}</span>
                <span className="text-[10px] text-cyan-400 uppercase font-sans font-medium">{item.type.replace('_', ' ')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
