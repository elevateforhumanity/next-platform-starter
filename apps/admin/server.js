/**
 * apps/admin/server.js - Standalone-compatible custom server
 *
 * Wraps the Next.js standalone startServer with a WebSocket proxy for
 * the Dev Studio terminal tab (/api/devstudio/shell-ws).
 *
 * IMPORTANT: The generated standalone server.js embeds `nextConfig` inline.
 * This file replaces that generated entrypoint, so we MUST load the same config
 * from `.next/required-server-files.json` and pass `config` into startServer.
 * Using `__NEXT_PRIVATE_STANDALONE_CONFIG = '{}'` alone causes startup crashes
 * (path.join with undefined) inside Next's config watcher / router.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const dir = path.join(__dirname);
const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOSTNAME ?? '0.0.0.0';

process.env.NODE_ENV = 'production';
process.chdir(dir);

function loadStandaloneNextConfig() {
  if (process.env.__NEXT_PRIVATE_STANDALONE_CONFIG) {
    try {
      const parsed = JSON.parse(process.env.__NEXT_PRIVATE_STANDALONE_CONFIG);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('[admin] Failed to parse __NEXT_PRIVATE_STANDALONE_CONFIG:', err.message);
    }
  }

  const manifestPath = path.join(dir, '.next', 'required-server-files.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `[admin] Missing ${manifestPath}. Rebuild admin with "pnpm next build" in apps/admin.`,
    );
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest?.config) {
    throw new Error(`[admin] ${manifestPath} has no config field`);
  }
  return manifest.config;
}

let nextConfig;
try {
  nextConfig = loadStandaloneNextConfig();
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);
} catch (err) {
  console.error('[admin] Failed to load Next.js standalone config');
  console.error(err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
}

// Required by the standalone runtime; primes Next.js module resolution.
require('next');

const SHELL_WS_URL = process.env.STUDIO_SHELL_WS_URL ?? '';
const SHELL_SECRET = process.env.STUDIO_SHELL_SECRET ?? '';
const TOKEN_SECRET = process.env.STUDIO_TOKEN_SECRET ?? SHELL_SECRET;
const WS_PATH = '/api/devstudio/shell-ws';

function toWebSocketUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'http:') url.protocol = 'ws:';
    if (url.protocol === 'https:') url.protocol = 'wss:';
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const SHELL_WS_TARGET = toWebSocketUrl(SHELL_WS_URL);

function isValidToken(token) {
  if (!TOKEN_SECRET) return false;
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

function attachWsProxy(server) {
  let WebSocket, WebSocketServer;
  try {
    ({ WebSocket, WebSocketServer } = require('ws'));
  } catch (err) {
    console.warn('[admin] ws module not available - shell-ws proxy disabled:', err.message);
    return;
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    if (url.pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    if (!SHELL_WS_TARGET) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (browserWs) => {
      browserWs.once('message', (rawData) => {
        let token;
        try {
          const msg = JSON.parse(rawData.toString());
          if (msg.type !== 'auth') throw new Error('expected auth frame');
          token = msg.token;
        } catch {
          browserWs.close(4001, 'Expected auth frame');
          return;
        }

        if (!isValidToken(token)) {
          browserWs.close(4003, 'Invalid or expired token');
          return;
        }

        const shellWs = new WebSocket(SHELL_WS_TARGET, {
          headers: { 'x-studio-secret': SHELL_SECRET, 'x-user-id': getUserIdFromToken(token) },
        });

        shellWs.on('open', () => {
          if (browserWs.readyState === WebSocket.OPEN) {
            browserWs.send(JSON.stringify({ type: 'ready' }));
          }
          browserWs.on('message', (d) => {
            if (shellWs.readyState === WebSocket.OPEN) shellWs.send(d);
          });
          shellWs.on('message', (d) => {
            if (browserWs.readyState === WebSocket.OPEN) browserWs.send(d);
          });
          browserWs.on('close', () => shellWs.close());
          browserWs.on('error', () => shellWs.close());
        });

        shellWs.on('close', (code, reasonBuffer) => {
          const reason = reasonBuffer?.toString() || 'Studio shell closed';
          if (browserWs.readyState === WebSocket.OPEN) {
            if (code !== 1000) {
              browserWs.send(JSON.stringify({ type: 'error', message: reason }));
            }
            browserWs.close(code === 1000 ? 1000 : 1011, reason);
          }
        });

        shellWs.on('error', (err) => {
          console.error('[studio-proxy] shell error:', err.message);
          if (browserWs.readyState === WebSocket.OPEN) {
            browserWs.send(JSON.stringify({ type: 'error', message: 'Could not connect to shell' }));
            browserWs.close(1011, 'Shell unavailable');
          }
        });
      });
    });
  });
}

const _createServer = http.createServer.bind(http);
http.createServer = function (...args) {
  const server = _createServer(...args);
  attachWsProxy(server);
  http.createServer = _createServer;
  return server;
};

process.on('uncaughtException', (err) => {
  console.error('[admin] uncaughtException:', err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[admin] unhandledRejection:', reason);
  if (reason instanceof Error && reason.stack) console.error(reason.stack);
  process.exit(1);
});

const { startServer } = require('next/dist/server/lib/start-server');

console.info('[admin] starting', { dir, port, host, distDir: nextConfig?.distDir });

startServer({
  dir,
  isDev: false,
  config: nextConfig,
  hostname: host,
  port,
  allowRetry: false,
}).catch((err) => {
  console.error('[admin] startup error:', err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
