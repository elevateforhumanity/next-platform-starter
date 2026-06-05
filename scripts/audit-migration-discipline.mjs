#!/usr/bin/env node
/**
 * Migration + platform discipline audit (offline + optional live DB probes).
 *
 * Usage:
 *   node scripts/audit-migration-discipline.mjs
 *   node scripts/audit-migration-discipline.mjs --json > audit_out/migration-discipline.json
 *
 * Live probes require NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (not placeholder).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT, 'supabase/migrations');
const OUT_DIR = path.join(ROOT, 'audit_out');

const jsonMode = process.argv.includes('--json');

function readMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function analyzeFilenameCollisions(files) {
  const byPrefix = {};
  for (const f of files) {
    const prefix = f.slice(0, 14);
    (byPrefix[prefix] ??= []).push(f);
  }
  return Object.entries(byPrefix)
    .filter(([, arr]) => arr.length > 1)
    .map(([prefix, arr]) => ({ prefix, files: arr }))
    .sort((a, b) => b.files.length - a.files.length);
}

function analyzeDuplicateCreates(files) {
  const tableCreations = {};
  for (const file of files) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const match of content.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?([a-z_]+)/gi)) {
      const name = match[1].toLowerCase();
      (tableCreations[name] ??= []).push(file);
    }
  }
  return Object.entries(tableCreations)
    .filter(([, arr]) => arr.length > 1)
    .map(([table, arr]) => ({ table, count: arr.length, files: arr }))
    .sort((a, b) => b.count - a.count);
}

function checkCorruptedScripts() {
  const suspects = [
    'scripts/run-migrations-now.mjs',
    'scripts/execute-migration.js',
  ];
  const corrupted = [];
  for (const rel of suspects) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const head = fs.readFileSync(full, 'utf8').slice(0, 200);
    if (head.includes('process.env.SUPABASE_SERVICE_ROLE_KEYprocess.env')) {
      corrupted.push(rel);
    }
  }
  return corrupted;
}

function grepCount(pattern, glob) {
  try {
    const out = execSync(`rg -l "${pattern}" ${glob} 2>/dev/null | wc -l`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

async function liveProbes() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'placeholder' || key.length < 30) {
    return {
      skipped: true,
      reason: 'SUPABASE_SERVICE_ROLE_KEY missing or placeholder — live probes skipped',
    };
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  const ping = await fetch(`${url}/rest/v1/programs?select=slug&limit=1`, { headers });
  if (!ping.ok) {
    return { skipped: true, reason: `REST probe failed: ${ping.status}` };
  }

  const rpc = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql: 'SELECT 1 AS ok' }),
  });
  const rpcOk = rpc.status === 200 || rpc.status === 204;

  let trackedCount = null;
  const migHead = await fetch(`${url}/rest/v1/efh_migrations?select=filename`, {
    headers: { ...headers, Prefer: 'count=exact' },
    method: 'HEAD',
  });
  if (migHead.ok) {
    const range = migHead.headers.get('content-range') || '';
    const m = range.match(/\/(\d+)/);
    if (m) trackedCount = parseInt(m[1], 10);
  }

  return {
    skipped: false,
    execSqlAvailable: rpcOk,
    efhMigrationsTracked: trackedCount,
    note: 'Run: node scripts/db/runMigrations.js (applies untracked files via exec_sql)',
  };
}

async function main() {
  const files = readMigrationFiles();
  const collisions = analyzeFilenameCollisions(files);
  const duplicateTables = analyzeDuplicateCreates(files);
  const corruptedScripts = checkCorruptedScripts();

  const legacyDeployRefs = {
    deploy_aws_yml: fs.existsSync(path.join(ROOT, '.github/workflows/deploy-aws.yml')),
    ecs_task_json: fs.existsSync(path.join(ROOT, 'aws/ecs-task-lms.json')),
    northflank_dockerfiles: ['Dockerfile.northflank-lms', 'Dockerfile.northflank-admin'].filter((f) =>
      fs.existsSync(path.join(ROOT, f)),
    ),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    migrations: {
      totalFiles: files.length,
      uniquePrefixes: new Set(files.map((f) => f.slice(0, 14))).size,
      timestampCollisions: collisions,
      collisionGroupCount: collisions.length,
      collisionFileCount: collisions.reduce((s, c) => s + c.files.length, 0),
      topDuplicateTableCreates: duplicateTables.slice(0, 15),
      duplicateTableCount: duplicateTables.length,
      pendingBundle: fs.existsSync(
        path.join(MIGRATIONS_DIR, '20260703000002_pending_migrations_bundle.sql'),
      ),
      agentsPendingList: [
        '20260702000009_normalize_two_factor_auth.sql',
        '20260702000010_onboarding_progress_unique.sql',
        '20260702000011_ensure_storage_buckets.sql',
        '20260702000012_external_courses_support_fee.sql',
      ],
    },
    scripts: {
      corruptedSanitization: corruptedScripts,
      canonicalRunner: 'scripts/db/runMigrations.js',
      lintCommand: 'node scripts/lint-migrations.cjs',
    },
    legacy: legacyDeployRefs,
    codeHygiene: {
      miladyStringRefs: grepCount('Milady', 'data/programs app/programs components'),
      deployAwsDocRefs: grepCount('deploy-aws', 'docs'),
    },
    live: await liveProbes(),
    recommendations: [
      'Never reuse YYYYMMDDNNNNNN prefixes — increment suffix for same-day migrations.',
      'Track applied files in public.efh_migrations via scripts/db/runMigrations.js.',
      'Apply 20260703000002_pending_migrations_bundle.sql in SQL Editor if July 20260702 singles are pending.',
      'Set real SUPABASE_SERVICE_ROLE_KEY + DATABASE_URL in CI/agent env before automated apply.',
      'Rename or merge timestamp-collision files only with a live DB diff — do not reorder blindly.',
      'Production deploy path is Northflank (deploy-lms.yml / deploy-admin.yml), not ECS.',
    ],
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, 'migration-discipline.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  console.log('=== Elevate LMS — Migration & Platform Discipline Audit ===\n');
  console.log(`Migrations: ${report.migrations.totalFiles} files, ${report.migrations.uniquePrefixes} unique prefixes`);
  console.log(
    `Timestamp collisions: ${report.migrations.collisionGroupCount} groups (${report.migrations.collisionFileCount} files)`,
  );
  if (collisions.length) {
    console.log('\nTop collisions (fix discipline — do not add more):');
    collisions.slice(0, 8).forEach((c) => {
      console.log(`  ${c.prefix} (${c.files.length}):`);
      c.files.forEach((f) => console.log(`    - ${f}`));
    });
  }
  console.log(`\nDuplicate CREATE TABLE targets: ${report.migrations.duplicateTableCount} tables (many idempotent IF NOT EXISTS)`);
  if (corruptedScripts.length) {
    console.log('\n❌ Corrupted migration scripts (sanitization damage):');
    corruptedScripts.forEach((s) => console.log(`  - ${s}`));
  } else {
    console.log('\n✅ No corrupted migration runner scripts detected');
  }
  console.log('\nDeploy canonical path:');
  console.log(`  Northflank Dockerfiles: ${legacyDeployRefs.northflank_dockerfiles.join(', ') || 'none'}`);
  console.log(`  deploy-aws.yml in repo: ${legacyDeployRefs.deploy_aws_yml ? 'YES (stale)' : 'no'}`);
  console.log(`  aws/ecs-task-lms.json: ${legacyDeployRefs.ecs_task_json ? 'present (reference only)' : 'missing'}`);
  if (report.live.skipped) {
    console.log(`\n⚠️  Live DB: ${report.live.reason}`);
  } else {
    console.log(`\nLive DB: exec_sql=${report.live.execSqlAvailable}, efh_migrations tracked=${report.live.efhMigrationsTracked ?? 'unknown'}`);
  }
  console.log('\nFull JSON:', jsonPath);
  console.log('\nRecommended apply (with real service role key):');
  console.log('  set -a && source .env.local && set +a && node scripts/db/runMigrations.js');
  console.log('  — or paste supabase/migrations/20260703000002_pending_migrations_bundle.sql in SQL Editor');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
