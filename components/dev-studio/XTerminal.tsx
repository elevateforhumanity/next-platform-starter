'use client';

import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';

export interface XTerminalHandle {
  write: (data: string) => void;
  clear: () => void;
  focus: () => void;
}

interface XTerminalProps {
  onClear?: () => void;
}

const XTerminal = forwardRef<XTerminalHandle, XTerminalProps>(({ onClear }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[]>([
    '\x1b[1;36m╔════════════════════════════════════════╗\x1b[0m',
    '\x1b[1;36m║\x1b[0m   \x1b[1;33mElevate Dev Studio Terminal\x1b[0m          \x1b[1;36m║\x1b[0m',
    '\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m',
    '',
    '\x1b[90mReady. Use the buttons above to run commands.\x1b[0m',
    '',
  ]);

  /* eslint-disable no-control-regex */
  const ansiToHtml = (text: string): string => {
    return text
      .replace(/\x1b\[0m/g, '</span>')
      .replace(/\x1b\[1;36m/g, '<span style="color: #39c5cf; font-weight: bold">')
      .replace(/\x1b\[1;33m/g, '<span style="color: #d29922; font-weight: bold">')
      .replace(/\x1b\[32m/g, '<span style="color: #3fb950">')
      .replace(/\x1b\[31m/g, '<span style="color: #f85149">')
      .replace(/\x1b\[33m/g, '<span style="color: #d29922">')
      .replace(/\x1b\[90m/g, '<span style="color: #6e7681">')
      .replace(/\x1b\[2J\x1b\[H/g, '') // Clear screen sequence
      .replace(/\x1b\[\d+m/g, ''); // Remove any other ANSI codes
  };
  /* eslint-enable no-control-regex */

  useImperativeHandle(ref, () => ({
    write: (data: string) => {
      const newLines = data.split('\n');
      setLines((prev) => [...prev, ...newLines.filter((l) => l !== '')]);

      // Auto-scroll
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 10);
    },
    clear: () => {
      setLines([]);
    },
    focus: () => {
      terminalRef.current?.focus();
    },
  }));

  const handleClear = () => {
    setLines([]);
    onClear?.();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Terminal</span>
        </div>
        <button
          onClick={handleClear}
          className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          title="Clear terminal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 p-3 overflow-auto font-mono text-sm text-slate-700 leading-relaxed bg-white"
      >
        {lines.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: ansiToHtml(line) || '&nbsp;' }} />
        ))}
      </div>
    </div>
  );
});

XTerminal.displayName = 'XTerminal';

export default XTerminal;
