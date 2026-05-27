#!/usr/bin/env node
/**
 * Automatic Supabase Migration Runner
 *
 * Strategy (in priority order):
 *   1. Supabase Management API  — works in CI (no direct TCP needed)
 *   2. pg direct connection     — works locally when IPv4 is available
 *
 * Required env vars:
 *   Management API path (preferred):
 *     SUPABASE_MANAGEMENT_API_KEY  — personal access token or service key
 *     SUPABASE_PROJECT_REF         — project ref (e.g. cuxzzpsyufcewtmicszk)
 *
 *   Direct pg path (fallback):
 *     SUPABASE_DB_URL              — full postgres:// connection string
 *     OR SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF
 */

import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

config({ path: join(rootDir, '.env.local') });

// ── Read migration files ──────────────────────────────────────────────────────

const migrationsDir = join(rootDir, 'supabase/migrations');
let migrationFiles;
try {
  migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
} catch (err) {
  console.error('❌ Could not read migrations directory:', err.message);
  process.exit(1);
}

console.log(`Found ${migrationFiles.length} migration files.`);

// ── Management API runner ─────────────────────────────────────────────────────

async function runViaMgmtApi(sql) {
  const key = process.env.SUPABASE_MANAGEMENT_API_KEY;
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (!key || !ref) return null; // not configured

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
    signal: AbortSignal.timeout(30000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.message) {
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }
  return body;
}

// ── pg direct runner ──────────────────────────────────────────────────────────

async function buildPgClient() {
  const { default: pg } = await import('pg');
  const { Client } = pg;

  let connStr = process.env.SUPABASE_DB_URL;
  if (!connStr) {
    const password = process.env.SUPABASE_DB_PASSWORD;
    const ref = process.env.SUPABASE_PROJECT_REF;
    if (password && ref) {
      connStr = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    }
  }
  if (!connStr) return null;

  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return client;
}

// ── Tracking table helpers ────────────────────────────────────────────────────

const TRACKING_DDL = `
  CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
  );
`;

const RECORD_SUCCESS = (filename) =>
  `INSERT INTO _migrations (filename, success) VALUES ('${filename.replace(/'/g, "''")}', TRUE)
   ON CONFLICT (filename) DO UPDATE SET success = TRUE, executed_at = NOW();`;

const RECORD_FAILURE = (filename, msg) =>
  `INSERT INTO _migrations (filename, success, error_message)
   VALUES ('${filename.replace(/'/g, "''")}', FALSE, '${msg.replace(/'/g, "''")}')
   ON CONFLICT (filename) DO UPDATE SET success = FALSE, error_message = EXCLUDED.error_message, executed_at = NOW();`;

// ── Main ──────────────────────────────────────────────────────────────────────

// Detect which runner to use
const mgmtKey = process.env.SUPABASE_MANAGEMENT_API_KEY;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const useMgmtApi = !!(mgmtKey && projectRef);

let pgClient = null;

if (useMgmtApi) {
  console.log('🔌 Using Supabase Management API');
  // Ensure tracking table
  await runViaMgmtApi(TRACKING_DDL).catch(() => {});
} else {
  console.log('🔌 Using direct pg connection');
  try {
    pgClient = await buildPgClient();
    if (!pgClient) {
      console.warn('⚠️  No database connection available — skipping automated migration run.');
      console.warn('   Migrations should be applied manually via the Supabase Dashboard.');
      console.warn('   Set SUPABASE_MANAGEMENT_API_KEY + SUPABASE_PROJECT_REF to enable CI migrations.');
      process.exit(0);
    }
    console.log('✅ Connected to database.');
    await pgClient.query(TRACKING_DDL);
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
    process.exit(1);
  }
}

// Get already-executed migrations
let executedSet = new Set();
try {
  const selectSql = `SELECT filename FROM _migrations WHERE success = TRUE`;
  if (useMgmtApi) {
    const rows = await runViaMgmtApi(selectSql);
    executedSet = new Set((rows ?? []).map((r) => r.filename));
  } else {
    const { rows } = await pgClient.query(selectSql);
    executedSet = new Set(rows.map((r) => r.filename));
  }
} catch {
  // Tracking table may not exist yet — proceed without skip list
}

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const filename of migrationFiles) {
  if (executedSet.has(filename)) {
    skipCount++;
    continue;
  }

  console.log(`▶ Running: ${filename}`);
  const sql = readFileSync(join(migrationsDir, filename), 'utf8');

  try {
    if (useMgmtApi) {
      await runViaMgmtApi(sql);
      await runViaMgmtApi(RECORD_SUCCESS(filename)).catch(() => {});
    } else {
      await pgClient.query('BEGIN');
      await pgClient.query(sql);
      await pgClient.query('COMMIT');
      await pgClient.query(RECORD_SUCCESS(filename)).catch(() => {});
    }
    successCount++;
    console.log(`  ✅ ${filename}`);
  } catch (err) {
    if (!useMgmtApi) await pgClient.query('ROLLBACK').catch(() => {});

    const msg = err.message ?? String(err);
    // Idempotent errors are not failures (already exists, duplicate key, etc.)
    const isIdempotent =
      msg.includes('already exists') ||
      msg.includes('duplicate key') ||
      msg.includes('does not exist') && msg.includes('DROP');

    if (isIdempotent) {
      console.log(`  ⚠️  ${filename}: skipped (idempotent — ${msg.slice(0, 80)})`);
      if (useMgmtApi) {
        await runViaMgmtApi(RECORD_SUCCESS(filename)).catch(() => {});
      } else {
        await pgClient.query(RECORD_SUCCESS(filename)).catch(() => {});
      }
      successCount++;
    } else {
      errorCount++;
      console.error(`  ❌ ${filename}: ${msg}`);
      if (useMgmtApi) {
        await runViaMgmtApi(RECORD_FAILURE(filename, msg)).catch(() => {});
      } else {
        await pgClient.query(RECORD_FAILURE(filename, msg)).catch(() => {});
      }
      if (process.env.CI === 'true') break;
    }
  }
}

if (pgClient) await pgClient.end().catch(() => {});

console.log(`\nDone: ${successCount} applied, ${skipCount} skipped, ${errorCount} failed.`);

if (errorCount > 0) {
  process.exit(1);
}
