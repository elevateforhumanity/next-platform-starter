'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

interface XTerminalProps {
  onCommand: (cmd: string) => Promise<string>;
}

// xterm must be client-only — no SSR
export default function XTerminal({ onCommand }: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const fitRef = useRef<any>(null);

  useEffect(() => {
    let term: any;
    let fitAddon: any;

    async function init() {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      await import('@xterm/xterm/css/xterm.css');

      term = new Terminal({
        theme: {
          background: '#0d1117',
          foreground: '#e6edf3',
          cursor: '#58a6ff',
          selectionBackground: '#264f78',
          black: '#484f58',
          red: '#ff7b72',
          green: '#3fb950',
          yellow: '#d29922',
          blue: '#58a6ff',
          magenta: '#bc8cff',
          cyan: '#39c5cf',
          white: '#b1bac4',
          brightBlack: '#6e7681',
          brightRed: '#ffa198',
          brightGreen: '#56d364',
          brightYellow: '#e3b341',
          brightBlue: '#79c0ff',
          brightMagenta: '#d2a8ff',
          brightCyan: '#56d4dd',
          brightWhite: '#f0f6fc',
        },
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 5000,
        allowTransparency: false,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      if (containerRef.current) {
        term.open(containerRef.current);
        fitAddon.fit();
      }

      termRef.current = term;
      fitRef.current = fitAddon;

      // Welcome message
      term.writeln('\x1b[1;34m╔══════════════════════════════════════╗\x1b[0m');
      term.writeln('\x1b[1;34m║   Elevate Dev Studio Terminal        ║\x1b[0m');
      term.writeln('\x1b[1;34m╚══════════════════════════════════════╝\x1b[0m');
      term.writeln('');
      term.writeln('\x1b[90mType any shell command. Powered by bash.\x1b[0m');
      term.writeln('');

      let currentLine = '';
      const historyBuf: string[] = [];
      let historyIdx = -1;

      const prompt = () => {
        term.write('\x1b[1;32m❯\x1b[0m \x1b[1;34m~/elevate-lms\x1b[0m \x1b[0m$ ');
      };

      prompt();

      term.onKey(async ({ key, domEvent }: { key: string; domEvent: KeyboardEvent }) => {
        const code = domEvent.keyCode;

        if (domEvent.ctrlKey && key === 'c') {
          term.writeln('^C');
          currentLine = '';
          prompt();
          return;
        }

        if (domEvent.ctrlKey && key === 'l') {
          term.clear();
          prompt();
          return;
        }

        if (code === 13) {
          // Enter
          term.writeln('');
          const cmd = currentLine.trim();
          currentLine = '';
          historyIdx = -1;

          if (!cmd) {
            prompt();
            return;
          }

          historyBuf.unshift(cmd);
          if (historyBuf.length > 100) historyBuf.pop();

          if (cmd === 'clear') {
            term.clear();
            prompt();
            return;
          }

          term.write('\x1b[90m');
          try {
            const output = await onCommand(cmd);
            const lines = output.split('\n');
            for (const line of lines) {
              term.writeln(line);
            }
          } catch (e: any) {
            term.writeln(`\x1b[31mError: ${e.message}\x1b[0m`);
          }
          term.write('\x1b[0m');
          prompt();
        } else if (code === 8) {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code === 38) {
          // Arrow up — history
          if (historyIdx < historyBuf.length - 1) {
            historyIdx++;
            const entry = historyBuf[historyIdx];
            term.write('\r\x1b[K');
            prompt();
            term.write(entry);
            currentLine = entry;
          }
        } else if (code === 40) {
          // Arrow down — history
          if (historyIdx > 0) {
            historyIdx--;
            const entry = historyBuf[historyIdx];
            term.write('\r\x1b[K');
            prompt();
            term.write(entry);
            currentLine = entry;
          } else if (historyIdx === 0) {
            historyIdx = -1;
            term.write('\r\x1b[K');
            prompt();
            currentLine = '';
          }
        } else if (code >= 32) {
          currentLine += key;
          term.write(key);
        }
      });

      // Resize observer
      const ro = new ResizeObserver(() => fitAddon?.fit());
      if (containerRef.current) ro.observe(containerRef.current);
      return () => ro.disconnect();
    }

    const cleanup = init();
    return () => {
      cleanup.then((fn) => fn?.());
      termRef.current?.dispose();
    };
  }, [onCommand]);

  return <div ref={containerRef} className="h-full w-full" style={{ background: '#0d1117' }} />;
}
