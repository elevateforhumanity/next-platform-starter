/**
 * apps/admin/server.js — Custom Next.js server
 *
 * Extends the Next.js standalone server with WebSocket proxy support
 * for the Dev Studio terminal tab. All other requests are handled by
 * Next.js normally.
 *
 * WebSocket upgrade path: /api/devstudio/shell-ws
 *   1. Validates X-Studio-Token header (set by the browser after the
 *      Next.js auth check issues a short-lived token).
 *   2. Opens a WebSocket connection to the studio-shell ECS container.
 *   3. Pipes frames bidirectionally.
 *
 * The studio-shell container URL is set via STUDIO_SHELL_WS_URL env var
 * (ECS service discovery: ws://elevate-studio.local:8888).
 */

'use strict';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocket, WebSocketServer } = require('ws');

const dev  = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT ?? '3000', 10);

const SHELL_WS_URL  = process.env.STUDIO_SHELL_WS_URL ?? '';
const SHELL_SECRET  = process.env.STUDIO_SHELL_SECRET ?? '';
const WS_PATH       = '/api/devstudio/shell-ws';

const app    = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // ── WebSocket upgrade handler ─────────────────────────────────────────────
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url ?? '');

    if (pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    // Validate the short-lived studio token issued by /api/devstudio/shell-token
    const token = req.headers['x-studio-token'];
    if (!token || !isValidToken(token)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const userId = getUserIdFromToken(token);

    if (!SHELL_WS_URL) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (browserWs) => {
      // Connect to the shell container
      const shellWs = new WebSocket(SHELL_WS_URL, {
        headers: {
          'x-studio-secret': SHELL_SECRET,
          'x-user-id': userId,
        },
      });

      shellWs.on('open', () => {
        // Pipe browser → shell
        browserWs.on('message', (data) => {
          if (shellWs.readyState === WebSocket.OPEN) {
            shellWs.send(data);
          }
        });

        // Pipe shell → browser
        shellWs.on('message', (data) => {
          if (browserWs.readyState === WebSocket.OPEN) {
            browserWs.send(data);
          }
        });

        browserWs.on('close', () => shellWs.close());
        shellWs.on('close', () => {
          if (browserWs.readyState === WebSocket.OPEN) browserWs.close();
        });

        browserWs.on('error', () => shellWs.close());
        shellWs.on('error', () => {
          if (browserWs.readyState === WebSocket.OPEN) {
            browserWs.send(JSON.stringify({ type: 'error', message: 'Shell connection lost' }));
            browserWs.close();
          }
        });
      });

      shellWs.on('error', (err) => {
        console.error('[studio-proxy] shell connection error:', err.message);
        if (browserWs.readyState === WebSocket.OPEN) {
          browserWs.send(JSON.stringify({ type: 'error', message: 'Could not connect to shell' }));
          browserWs.close(1011, 'Shell unavailable');
        }
      });
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[admin] ready on :${port}`);
  });
});

// ── Token validation ──────────────────────────────────────────────────────────
// Short-lived tokens are issued by /api/devstudio/shell-token (HMAC-SHA256,
// 60s TTL). This avoids sending the Supabase session cookie over the WebSocket
// upgrade request where cookie forwarding is unreliable.

const crypto = require('crypto');
const TOKEN_SECRET = process.env.STUDIO_TOKEN_SECRET ?? SHELL_SECRET;
const TOKEN_TTL_MS = 60_000;

function isValidToken(token) {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expected = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('base64url');
    if (sig !== expected) return false;
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Date.now() < exp;
  } catch {
    return false;
  }
}

function getUserIdFromToken(token) {
  try {
    const [payload] = token.split('.');
    const { uid } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return uid ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
