import React, { useState } from 'react';
import { X, Database, Table, Eye, Search, Layers, RefreshCw } from 'lucide-react';
import { TrueForgeDatabase } from '../services/databaseEngine';

interface DatabaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prodDb: TrueForgeDatabase;
  sandboxDb: TrueForgeDatabase | null;
  devDb: TrueForgeDatabase;
}

export const DatabaseExplorerModal: React.FC<DatabaseExplorerModalProps> = ({
  isOpen,
  onClose,
  prodDb,
  sandboxDb,
  devDb,
}) => {
  const [selectedEnv, setSelectedEnv] = useState<'PRODUCTION' | 'SANDBOX' | 'DEVELOPMENT'>('PRODUCTION');
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentDb = selectedEnv === 'PRODUCTION' ? prodDb : selectedEnv === 'SANDBOX' ? (sandboxDb || prodDb) : devDb;
  const tableNames = Object.keys(currentDb.schema.tables);
  const currentTableDef = currentDb.schema.tables[selectedTable];
  const currentRows = ((currentDb.state as any)[selectedTable] || []) as Record<string, any>[];

  const filteredRows = currentRows.filter(row => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(val => String(val).toLowerCase().includes(term));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1424] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-slate-900 border border-slate-800 text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Database Catalog & Table Explorer</h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                  PostgreSQL 16
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect real schema, columns, and data rows across environments
              </p>
            </div>
          </div>

          {/* Environment Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1 text-xs">
            <button
              onClick={() => setSelectedEnv('DEVELOPMENT')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                selectedEnv === 'DEVELOPMENT' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Development
            </button>
            <button
              onClick={() => setSelectedEnv('SANDBOX')}
              disabled={!sandboxDb}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                selectedEnv === 'SANDBOX'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow'
                  : sandboxDb
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              Sandbox {!sandboxDb && '(not cloned)'}
            </button>
            <button
              onClick={() => setSelectedEnv('PRODUCTION')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                selectedEnv === 'PRODUCTION'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Production 🔒
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Explorer Workspace */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Table Selector Sidebar */}
          <div className="w-56 border-r border-slate-800 bg-[#080d17] p-3 space-y-1.5 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
              Tables ({tableNames.length})
            </span>
            {tableNames.map(tbl => {
              const count = ((currentDb.state as any)[tbl] || []).length;
              const isSelected = selectedTable === tbl;
              return (
                <button
                  key={tbl}
                  onClick={() => {
                    setSelectedTable(tbl);
                    setSearchTerm('');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors text-left ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-800 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Table className="h-3.5 w-3.5 text-slate-400" />
                    <span>{tbl}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Right Data Table Area */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0d1322]">
            {/* Table Meta Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#10182b] px-4 py-2.5">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono font-bold text-white text-sm">{selectedTable}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-mono">
                  {currentTableDef ? currentTableDef.columns.length : 0} columns
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-mono">{currentRows.length} total rows</span>
              </div>

              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Column Schema Pills */}
            {currentTableDef && (
              <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800/80 bg-slate-950/60 px-4 py-2 text-[11px] font-mono">
                <span className="text-slate-500 font-sans text-[10px] uppercase font-bold shrink-0">Schema:</span>
                {currentTableDef.columns.map(col => (
                  <span
                    key={col.name}
                    className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 border border-slate-800 text-slate-300 shrink-0"
                  >
                    <span className="font-semibold text-white">{col.name}</span>
                    <span className="text-cyan-400 text-[10px]">{col.type}</span>
                    {!col.nullable && <span className="text-amber-400 text-[10px]">*</span>}
                  </span>
                ))}
              </div>
            )}

            {/* Records Grid */}
            <div className="flex-1 overflow-auto p-4">
              {filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-slate-500">
                  <p>No records matching search term.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 z-10 border-b border-slate-800 bg-[#0d1424] text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      {currentTableDef?.columns.map(col => (
                        <th key={col.name} className="px-3 py-2 whitespace-nowrap">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredRows.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                        {currentTableDef?.columns.map(col => {
                          const val = row[col.name];
                          const isTruncated = row[`__truncated_${col.name}`];
                          return (
                            <td
                              key={col.name}
                              className={`px-3 py-2 whitespace-nowrap max-w-xs truncate ${
                                isTruncated ? 'text-amber-300 bg-amber-950/40 font-semibold' : 'text-slate-300'
                              }`}
                              title={String(val)}
                            >
                              {val === null || val === undefined ? (
                                <span className="text-slate-600 italic">NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
