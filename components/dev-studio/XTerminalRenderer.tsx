'use client';

/**
 * XTerminalRenderer — mounts xterm.js and wires it to the WebSocket.
 *
 * Loaded via dynamic import (ssr: false) from XTerminal.tsx.
 * Handles:
 *   - xterm.js Terminal + FitAddon lifecycle
 *   - Resize observer → sends { type: 'resize', cols, rows } to shell
 *   - Keyboard input → sends { type: 'input', data } to shell
 *   - Incoming { type: 'output', data } → writes to terminal
 *   - Incoming { type: 'exit', code } → prints exit message
 */

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface Props {
  ws: WebSocket | null;
  connecting: boolean;
}

export default function XTerminalRenderer({ ws, connecting }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef      = useRef<Terminal | null>(null);
  const fitRef       = useRef<FitAddon | null>(null);
  const roRef        = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Mount terminal
    const term = new Terminal({
      theme: {
        background:  '#0d1117',
        foreground:  '#e6edf3',
        cursor:      '#58a6ff',
        black:       '#484f58',
        red:         '#ff7b72',
        green:       '#3fb950',
        yellow:      '#d29922',
        blue:        '#58a6ff',
        magenta:     '#bc8cff',
        cyan:        '#39c5cf',
        white:       '#b1bac4',
        brightBlack: '#6e7681',
        brightWhite: '#f0f6fc',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fit   = new FitAddon();
    const links = new WebLinksAddon();
    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitRef.current  = fit;

    // Resize observer — refit and notify shell
    const ro = new ResizeObserver(() => {
      fit.fit();
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    });
    ro.observe(containerRef.current);
    roRef.current = ro;

    // Keyboard input → shell
    term.onData((data) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    return () => {
      ro.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current  = null;
    };
  }, []); // mount once

  // Wire incoming WebSocket messages to the terminal
  useEffect(() => {
    if (!ws) return;
    const term = termRef.current;
    if (!term) return;

    const onMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        switch (msg.type) {
          case 'output':
            term.write(msg.data as string);
            break;
          case 'exit':
            term.write(`\r\n\x1b[33m[process exited with code ${msg.code}]\x1b[0m\r\n`);
            break;
          case 'error':
            term.write(`\r\n\x1b[31m[error: ${msg.message}]\x1b[0m\r\n`);
            break;
          // pong — no-op
        }
      } catch {
        // binary frame or malformed JSON — write raw
        if (typeof event.data === 'string') {
          term.write(event.data);
        }
      }
    };

    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [ws]);

  // Send initial resize once connected
  useEffect(() => {
    if (!ws || !termRef.current || !fitRef.current) return;
    if (ws.readyState !== WebSocket.OPEN) return;
    fitRef.current.fit();
    ws.send(JSON.stringify({ type: 'resize', cols: termRef.current.cols, rows: termRef.current.rows }));
  }, [ws]);

  return (
    <div className="relative w-full h-full bg-[#0d1117]">
      {connecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] z-10">
          <span className="text-xs font-mono text-slate-500 animate-pulse">Connecting to shell…</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full p-1" />
    </div>
  );
}
