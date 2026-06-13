/**
 * scripts/lms-server.js — Graceful shutdown wrapper for Next.js standalone server.
 * Used by Dockerfile.northflank-lms instead of the default server.js.
 */
'use strict';

const { spawn } = require('child_process');
const http = require('http');

const host = process.env.HOSTNAME ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '8080', 10);
const DRAIN_TIMEOUT_MS = parseInt(process.env.DRAIN_TIMEOUT_MS ?? '10000', 10);

let isShuttingDown = false;
let serverProcess = null;

/**
 * Graceful shutdown handler for SIGTERM/SIGINT.
 * Northflank sends SIGTERM for container termination.
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`[lms] shutdown already in progress (${signal}), ignoring duplicate signal`);
    return;
  }
  isShuttingDown = true;

  console.log(`[lms] received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections immediately
  if (serverProcess && !serverProcess.killed) {
    console.log(`[lms] sending SIGTERM to Node server (pid=${serverProcess.pid})...`);
    serverProcess.kill('SIGTERM');
  }

  // Wait for graceful shutdown with timeout
  const startTime = Date.now();
  const checkInterval = 500;

  while (serverProcess && !serverProcess.killed) {
    if (Date.now() - startTime > DRAIN_TIMEOUT_MS) {
      console.warn(`[lms] drain timeout (${DRAIN_TIMEOUT_MS}ms) exceeded, forcing kill...`);
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  console.log(`[lms] shutdown complete (${signal})`);
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  const reasonStr = reason instanceof Error ? reason.message : String(reason);
  const isIntentional = reasonStr.includes('Server closed') ||
                        reasonStr.includes('socket hang up') ||
                        reasonStr.includes('ERR_CONNECTION_RESET');

  if (isIntentional || isShuttingDown) {
    console.debug(`[lms] suppressed unhandled rejection (${reasonStr})`);
    return;
  }

  console.error('[lms] unhandled promise rejection:', reason);
});

console.log(`[lms] starting Next.js standalone server on ${host}:${port}...`);

// Start the Next.js server
const nodeArgs = ['--max-http-header-size=32768', 'server.js'];
serverProcess = spawn('node', nodeArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    HOSTNAME: host,
    PORT: String(port),
  },
});

serverProcess.on('error', (err) => {
  console.error(`[lms] server process error: ${err.message}`);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (isShuttingDown) {
    // Expected exit during graceful shutdown
    return;
  }

  if (code === 0) {
    console.log(`[lms] server exited normally (code=${code})`);
  } else {
    console.error(`[lms] server crashed unexpectedly (code=${code}, signal=${signal})`);
    process.exit(1);
  }
});

console.log(`[lms] server wrapper ready (wrapper_pid=${process.pid}, server_pid will be=${serverProcess.pid})`);