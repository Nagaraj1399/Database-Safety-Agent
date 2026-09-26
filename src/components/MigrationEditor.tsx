import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, Code, ShieldAlert, CheckCircle, Database } from 'lucide-react';
import { DEMO_SCENARIOS } from '../services/scenarioData';
import { MigrationScenario } from '../types/database';

interface MigrationEditorProps {
  onRunValidation: (sql: string, title: string, rollbackSql?: string) => void;
  isValidating: boolean;
}

export const MigrationEditor: React.FC<MigrationEditorProps> = ({ onRunValidation, isValidating }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEMO_SCENARIOS[0].id);
  const [customSql, setCustomSql] = useState<string>(DEMO_SCENARIOS[0].sql);
  const [rollbackSql, setRollbackSql] = useState<string>(DEMO_SCENARIOS[0].rollbackSql);
  const [title, setTitle] = useState<string>(DEMO_SCENARIOS[0].title);
  const [activeTab, setActiveTab] = useState<'migration' | 'rollback'>('migration');

  const handleSelectScenario = (scenario: MigrationScenario) => {
    setSelectedScenarioId(scenario.id);
    setCustomSql(scenario.sql);
    setRollbackSql(scenario.rollbackSql);
    setTitle(scenario.title);
  };

  const currentScenario = DEMO_SCENARIOS.find(s => s.id === selectedScenarioId);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-lg shadow-black/40">
      {/* Header & Scenario Selector */}
      <div className="border-b border-slate-800/80 bg-[#10182b] px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">Migration Proposal</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit SQL schema migration for autonomous sandbox validation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Scenarios:</span>
            <select
              value={selectedScenarioId}
              onChange={e => {
                const sc = DEMO_SCENARIOS.find(s => s.id === e.target.value);
                if (sc) handleSelectScenario(sc);
                else setSelectedScenarioId(e.target.value);
              }}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              {DEMO_SCENARIOS.map(sc => (
                <option key={sc.id} value={sc.id}>
                  {sc.title} ({sc.expectedOutcome})
                </option>
              ))}
              <option value="custom">Custom SQL Input</option>
            </select>
          </div>
        </div>

        {/* Scenario description callout */}
        {currentScenario && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
            {currentScenario.expectedOutcome === 'PASS' ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : currentScenario.expectedOutcome === 'FAIL' ? (
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-semibold text-white">{currentScenario.title}: </span>
              <span>{currentScenario.description}</span>
            </div>
          </div>
        )}
      </div>

      {/* Editor Tabs & Title */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a0f1d] px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('migration')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'migration'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            migration.sql
          </button>
          <button
            onClick={() => setActiveTab('rollback')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'rollback'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            rollback.sql (Inverse)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <Database className="h-3 w-3 text-slate-500" /> PostgreSQL 16
          </span>
          <span className="text-slate-600">·</span>
          <span>Target: isolated sandbox</span>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="p-3 bg-[#080d19]">
        {activeTab === 'migration' ? (
          <div className="relative font-mono text-xs">
            <textarea
              value={customSql}
              onChange={e => {
                setCustomSql(e.target.value);
                if (selectedScenarioId !== 'custom') setSelectedScenarioId('custom');
              }}
              rows={5}
              spellCheck={false}
              className="w-full rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-cyan-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none leading-relaxed"
              placeholder="-- Enter PostgreSQL migration DDL/DML statements here..."
            />
          </div>
        ) : (
          <div className="relative font-mono text-xs">
            <textarea
              value={rollbackSql}
              onChange={e => setRollbackSql(e.target.value)}
              rows={5}
              spellCheck={false}
              className="w-full rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-amber-200/90 placeholder-slate-600 focus:border-amber-500 focus:outline-none leading-relaxed"
              placeholder="-- Enter inverse rollback SQL statement here..."
            />
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-[#10182b] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>Agent executes against isolated Docker clone</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Production remains untouched</span>
        </div>

        <button
          onClick={() => onRunValidation(customSql, title, rollbackSql)}
          disabled={isValidating || !customSql.trim()}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isValidating ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Validating in Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Validate in Isolated Sandbox</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
