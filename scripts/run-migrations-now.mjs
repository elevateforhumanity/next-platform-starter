#!/usr/bin/env node
/**
 * Apply pending SQL migrations via Supabase exec_sql RPC.
 * Canonical implementation: scripts/db/runMigrations.js
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (not placeholder)
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, 'db/runMigrations.js');

const child = spawn(process.execPath, [runner], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 1));
