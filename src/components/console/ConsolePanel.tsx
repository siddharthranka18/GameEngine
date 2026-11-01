import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useEngineStore } from '../../store/engineStore';
import { LogLevel } from '../../core/types';

export const ConsolePanel: React.FC = () => {
  const { logs, clearLogs } = useEngineStore();
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<'all' | LogLevel>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-editor-danger flex-shrink-0" />;
      case 'warn':
        return <AlertTriangle className="w-3.5 h-3.5 text-editor-warning flex-shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-editor-success flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-editor-accent flex-shrink-0" />;
    }
  };

  return (
    <footer className="border-t border-editor-panelBorder bg-editor-panel flex flex-col z-20 select-none">
      {/* Console Bar / Header */}
      <div className="h-8 px-3 border-b border-editor-panelBorder flex items-center justify-between text-xs bg-editor-header">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-editor-accent" />
          <span className="font-semibold text-white tracking-wider uppercase text-[11px]">Console</span>
          <span className="px-1.5 py-0.2 rounded-full bg-editor-bg border border-editor-panelBorder text-[10px] text-editor-textMuted font-mono">
            {logs.length}
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1">
          {(['all', 'info', 'warn', 'error', 'success'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition ${
                filter === lvl
                  ? 'bg-editor-accent text-white'
                  : 'text-editor-textMuted hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}

          <div className="h-3 w-px bg-editor-panelBorder mx-1" />

          {/* Clear logs */}
          <button
            onClick={clearLogs}
            title="Clear Console"
            className="p-1 hover:text-white text-editor-textMuted"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Collapse Console' : 'Expand Console'}
            className="p-1 hover:text-white text-editor-textMuted"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Log Output Body */}
      {isOpen && (
        <div
          ref={scrollRef}
          className="h-36 overflow-y-auto p-2 font-mono text-[11px] space-y-1 bg-editor-bg"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-editor-textMuted text-center py-4 italic text-[11px]">
              No console messages.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-2 px-1.5 py-0.5 rounded hover:bg-editor-panel/50"
              >
                <span className="text-[10px] text-editor-textMuted select-none">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {getLogIcon(log.level)}
                <span
                  className={`flex-1 break-all ${
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warn'
                      ? 'text-amber-400'
                      : log.level === 'success'
                      ? 'text-emerald-400'
                      : 'text-editor-text'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </footer>
  );
};
