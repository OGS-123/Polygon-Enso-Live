import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Trash2, Check, ArrowDownCircle } from 'lucide-react';
import { LogEntry } from '../types/enso';

interface LiveConsoleProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({ logs, onClearLogs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'error' | 'success'>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'error') return l.level === 'error';
    if (filter === 'success') return l.level === 'success';
    return true;
  });

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-4 sm:p-5 space-y-3">
      {/* Console Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Live Execution Terminal</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-1 bg-[#0a0b12] p-0.5 rounded border border-[#21253a]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                filter === 'all' ? 'bg-[#23273e] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                filter === 'error' ? 'bg-red-950/80 text-red-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Errors
            </button>
          </div>

          <button
            onClick={copyLogs}
            title="Copy Logs"
            className="p-1.5 text-slate-400 hover:text-white rounded bg-[#181a28] border border-[#262a40] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearLogs}
            title="Clear Logs"
            className="p-1.5 text-slate-400 hover:text-red-400 rounded bg-[#181a28] border border-[#262a40] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={scrollRef}
        className="bg-[#07080d] border border-[#1a1d2e] rounded-lg p-3 h-52 overflow-y-auto font-mono text-xs space-y-1.5 selection:bg-purple-900"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-2">No log entries matching filter.</div>
        ) : (
          filteredLogs.map((log) => {
            let color = 'text-slate-300';
            if (log.level === 'error') color = 'text-red-400';
            else if (log.level === 'warn') color = 'text-amber-400';
            else if (log.level === 'success') color = 'text-emerald-400';

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 select-none shrink-0 text-[11px]">
                  {log.timestamp}
                </span>
                <span className={`select-none shrink-0 font-bold text-[10px] px-1 rounded ${
                  log.level === 'error'
                    ? 'bg-red-950 text-red-400'
                    : log.level === 'success'
                    ? 'bg-emerald-950 text-emerald-400'
                    : log.level === 'warn'
                    ? 'bg-amber-950 text-amber-400'
                    : 'bg-[#151726] text-purple-300'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className={`break-all ${color}`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
