import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Download, Folder } from 'lucide-react';
import { REPOSITORY_FILES } from '../services/repoFiles';

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectExportModal: React.FC<ProjectExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = REPOSITORY_FILES[selectedFileIdx];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1424] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-slate-900 border border-slate-800 text-blue-400">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Project Deliverable Codebase</h2>
              <p className="text-xs text-slate-400">
                Docker Compose, FastAPI Safety Agent, PostgreSQL DDL schemas & documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* File Tree Left Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-[#080d17] p-3 space-y-1 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
              Deliverable Files
            </span>
            {REPOSITORY_FILES.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIdx(idx)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-mono transition-colors text-left ${
                  selectedFileIdx === idx
                    ? 'bg-blue-950 text-blue-200 border border-blue-800 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>

          {/* Right Code Display */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0e1a]">
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0f1627] px-4 py-2 text-xs font-mono">
              <span className="text-white font-semibold">{currentFile.path}</span>
              <span className="text-slate-400 uppercase text-[10px]">{currentFile.language}</span>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-[#070b14]">
              <pre className="whitespace-pre">{currentFile.content}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
