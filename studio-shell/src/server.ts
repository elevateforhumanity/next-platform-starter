/**
 * Elevate Studio Shell — PTY WebSocket server
 *
 * Runs inside an ECS Fargate container alongside the cloned repo.
 * Each authenticated WebSocket connection gets its own PTY session
 * (real bash, real pnpm, real git). The Next.js admin app proxies
 * connections through /api/devstudio/shell-ws after verifying the
 * admin session — this server never has a public URL.
 *
 * Protocol (JSON frames over WebSocket):
 *   Client → Server:
 *     { type: 'input',  data: string }          — raw keystrokes / paste
 *     { type: 'resize', cols: number, rows: number }
 *     { type: 'ping' }
 *
 *   Server → Client:
 *     { type: 'output', data: string }           — raw PTY output (ANSI)
 *     { type: 'exit',   code: number }
 *     { type: 'pong' }
 *     { type: 'error',  message: string }
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';
import * as os from 'os';

const PORT = parseInt(process.env.SHELL_PORT ?? '8888', 10);
const SHELL = process.env.SHELL_BIN ?? '/bin/bash';
const WORKDIR = process.env.WORKDIR ?? '/repo';
const SECRET = process.env.SHELL_SECRET ?? '';  // shared secret from Next.js proxy
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS ?? '10', 10);
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS ?? '3600000', 10); // 1hr

interface Session {
  id: string;
  pty: pty.IPty;
  ws: WebSocket;
  timer: ReturnType<typeof setTimeout>;
  userId: string;
}

const sessions = new Map<string, Session>();

// ── Health check HTTP server (ECS health check hits GET /health) ──────────────
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', sessions: sessions.size, uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  // Auth: Next.js proxy passes X-Studio-Secret and X-User-Id headers
  const secret = req.headers['x-studio-secret'] as string | undefined;
  const userId = req.headers['x-user-id'] as string | undefined;

  if (SECRET && secret !== SECRET) {
    ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
    ws.close(1008, 'Unauthorized');
    return;
  }

  if (!userId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing user ID' }));
    ws.close(1008, 'Missing user ID');
    return;
  }

  if (sessions.size >= MAX_SESSIONS) {
    ws.send(JSON.stringify({ type: 'error', message: 'Session limit reached' }));
    ws.close(1013, 'Session limit reached');
    return;
  }

  const sessionId = uuidv4();

  // Spawn real PTY
  const shell = pty.spawn(SHELL, [], {
    name: 'xterm-256color',
    cols: 220,
    rows: 50,
    cwd: WORKDIR,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      HOME: os.homedir(),
      USER: 'studio',
      LOGNAME: 'studio',
      // Ensure pnpm/node are on PATH inside the container
      PATH: `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${os.homedir()}/.local/share/pnpm`,
    } as Record<string, string>,
  });

  // Stream PTY output → client
  shell.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  // PTY exit → notify client and clean up
  shell.onExit(({ exitCode }: { exitCode: number }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
      ws.close(1000, 'Shell exited');
    }
    cleanupSession(sessionId);
  });

  // Session timeout — kill idle sessions
  const timer = setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session timed out' }));
      ws.close(1001, 'Session timed out');
    }
    cleanupSession(sessionId);
  }, SESSION_TIMEOUT_MS);

  sessions.set(sessionId, { id: sessionId, pty: shell, ws, timer, userId });

  // Handle messages from client
  ws.on('message', (raw: Buffer) => {
    let msg: { type: string; data?: string; cols?: number; rows?: number };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) return;

    switch (msg.type) {
      case 'input':
        if (typeof msg.data === 'string') {
          session.pty.write(msg.data);
        }
        break;

      case 'resize':
        if (typeof msg.cols === 'number' && typeof msg.rows === 'number') {
          session.pty.resize(
            Math.max(1, Math.min(msg.cols, 500)),
            Math.max(1, Math.min(msg.rows, 200)),
          );
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  });

  ws.on('close', () => cleanupSession(sessionId));
  ws.on('error', () => cleanupSession(sessionId));

  console.log(`[studio-shell] session ${sessionId} opened for user ${userId} (total: ${sessions.size})`);
});

function cleanupSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;
  clearTimeout(session.timer);
  try { session.pty.kill(); } catch { /* already dead */ }
  sessions.delete(sessionId);
  console.log(`[studio-shell] session ${sessionId} closed (remaining: ${sessions.size})`);
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`[studio-shell] ${signal} received — closing ${sessions.size} sessions`);
  for (const [id] of sessions) cleanupSession(id);
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[studio-shell] listening on :${PORT} — workdir: ${WORKDIR} — shell: ${SHELL}`);
});
