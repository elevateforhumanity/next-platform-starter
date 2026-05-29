'use client';

/**
 * XTerminal — real xterm.js terminal connected to the studio-shell ECS container.
 *
 * Connection flow:
 *   1. POST /api/devstudio/shell-token  → short-lived HMAC token (60s TTL)
 *   2. WebSocket upgrade to /api/devstudio/shell-ws with X-Studio-Token header
 *      (custom Next.js server apps/admin/server.js proxies to ECS container)
 *   3. Bidirectional PTY frames:
 *        browser → shell: { type: 'input', data: string }
 *                         { type: 'resize', cols: number, rows: number }
 *                         { type: 'ping' }
 *        shell → browser: { type: 'output', data: string }
 *                         { type: 'exit', code: number }
 *                         { type: 'pong' }
 *                         { type: 'error', message: string }
 *
 * Falls back to a "not configured" message when STUDIO_SHELL_WS_URL is unset.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// xterm must be client-side only
const TerminalRenderer = dynamic(() => import('./XTerminalRenderer'), { ssr: false });

export interface XTerminalProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  /** Called with each chunk of text output from the shell — use to detect URLs */
  onOutput?: (text: string) => void;
  /**
   * Called once on mount with a `send` function the parent can store.
   * Calling send(cmd) types the command into the shell followed by Enter.
   * The function becomes a no-op when the WebSocket is not open.
   */
  onReady?: (send: (cmd: string) => void) => void;
}

type Status = 'connecting' | 'connected' | 'disconnected' | 'error' | 'unconfigured';

export default function XTerminal({ onConnect, onDisconnect, onOutput, onReady }: XTerminalProps) {
  const [status, setStatus] = useState<Status>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onReadyFiredRef = useRef(false);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setErrorMsg('');

    // Step 1 — get short-lived token
    let token: string;
    try {
      const res = await fetch('/api/devstudio/shell-token', { method: 'POST' });
      if (res.status === 503) {
        setStatus('unconfigured');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(`Auth failed (${res.status})`);
        return;
      }
      const data = await res.json();
      token = data.token;
    } catch (e) {
      setStatus('error');
      setErrorMsg('Could not reach auth endpoint');
      return;
    }

    // Step 2 — open WebSocket
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/devstudio/shell-ws`;
    const ws = new WebSocket(wsUrl, ['studio-shell']);
    ws.binaryType = 'arraybuffer';

    // Browser WebSocket API doesn't support custom headers — send token as
    // first frame. server.js validates it before opening the PTY shell and
    // sends back { type: 'ready' } once the ECS shell is open.
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));

      // Keepalive ping every 30s (starts immediately, before ready)
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30_000);
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      let msg: { type?: string; message?: string; code?: number };
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === 'ready') {
        // Shell PTY is open — now safe to show as connected
        setStatus('connected');
        onConnect?.();
        if (onReady && !onReadyFiredRef.current) {
          onReadyFiredRef.current = true;
          onReady((cmd: string) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'input', data: cmd + '\r' }));
            }
          });
        }
      } else if (msg.type === 'error') {
        setStatus('error');
        setErrorMsg(msg.message || 'Shell error');
        if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
      }
    };

    ws.onclose = (event) => {
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
      if (event.code === 4003) {
        setStatus('error');
        setErrorMsg('Shell auth token rejected — refresh and try again.');
        return;
      }
      if (event.code === 1011) {
        setStatus('error');
        setErrorMsg(event.reason || 'Shell proxy could not reach the studio container.');
        return;
      }
      setStatus('disconnected');
      onDisconnect?.();
    };

    ws.onerror = () => {
      setStatus('error');
      setErrorMsg('WebSocket connection failed');
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
    };
  }, [onConnect, onDisconnect, onReady]);

  useEffect(() => {
    connect();
    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current?.close(1001, 'Component unmounted');
    };
  }, [connect]);

  if (status === 'unconfigured') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-slate-400 gap-3 p-8">
        <p className="text-sm font-mono">Studio shell not configured.</p>
        <p className="text-xs text-slate-500 text-center max-w-sm">
          Set <code className="text-slate-300">STUDIO_SHELL_WS_URL</code> and{' '}
          <code className="text-slate-300">STUDIO_SHELL_SECRET</code> in SSM, then
          deploy the studio ECS task.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-red-400 gap-3 p-8">
        <p className="text-sm font-mono">{errorMsg || 'Connection error'}</p>
        <button
          onClick={connect}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-slate-400 gap-3 p-8">
        <p className="text-sm font-mono">Shell disconnected.</p>
        <button
          onClick={connect}
          className="text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <TerminalRenderer
        ws={wsRef.current}
        connecting={status === 'connecting'}
        onOutput={onOutput}
      />
    </div>
  );
}
