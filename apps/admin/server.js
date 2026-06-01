/**
 * apps/admin/server.js — Next.js standalone entry (admin ECS task).
 * Studio Shell WebSocket proxy removed — Lizzy uses GitHub API + /api/devstudio/shell (workflows) only.
 */
'use strict';

const path = require('path');

const dir = path.join(__dirname);
const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOSTNAME ?? '0.0.0.0';

process.env.NODE_ENV = 'production';
process.chdir(dir);

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG =
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG || '{}';
require('next');

const { startServer } = require('next/dist/server/lib/start-server');

startServer({
  dir,
  isDev: false,
  hostname: host,
  port,
  allowRetry: false,
}).catch((err) => {
  console.error('[admin] startup error:', err);
  process.exit(1);
});
