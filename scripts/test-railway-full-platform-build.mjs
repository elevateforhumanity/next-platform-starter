/**
 * test-railway-full-platform-build.mjs
 *
 * Verifies Railway full-platform build behavior:
 * - Netlify quarantine does not run
 * - Build compiles operational routes (admin/LMS/API/etc.)
 * - Netlify quarantine state is restored/cleaned before and after
 */

import { execSync } from 'child_process';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, '.next', 'server', 'app-paths-manifest.json');

function run(cmd, env = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  });
}

function normalizeRoute(route) {
  let clean = route.replace(/\/page$/, '').replace(/\/route$/, '');
  clean = clean.replace(/\/\([^)]+\)/g, '');
  return clean;
}

async function preflightRestore() {
  run('node scripts/netlify-quarantine-functions.mjs --restore');
  run('node scripts/netlify-quarantine-railway-routes.mjs --restore');
  run('node scripts/railway-quarantine-marketing-routes.mjs --restore');
}

async function assertManifestHasOperationalRoutes() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error('Missing .next/server/app-paths-manifest.json after build');
  }

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const routes = Object.keys(manifest).map(normalizeRoute);

  const REQUIRED_PREFIX_GROUPS = [
    ['/admin'],
    ['/lms'],
    ['/api'],
    ['/learner', '/student-portal'],
    ['/instructor'],
    ['/employer', '/employer-portal'],
    ['/partner', '/partner-portal'],
    ['/program-holder'],
  ];

  const missing = REQUIRED_PREFIX_GROUPS.filter(
    (group) =>
      !group.some((prefix) =>
        routes.some((route) => route === prefix || route.startsWith(prefix + '/')),
      ),
  );

  if (missing.length > 0) {
    throw new Error(
      `Railway full-platform build is missing required operational routes: ${missing
        .map((g) => g.join(' | '))
        .join(', ')}`,
    );
  }

  const routeCount = routes.length;
  console.log(`\n[railway-full] Compiled routes: ${routeCount}`);

  if (routeCount <= 300) {
    throw new Error(
      `Compiled route count ${routeCount} is too low for full-platform Railway build (expected > 300).`,
    );
  }
}

async function main() {
  if (process.env.NETLIFY === 'true') {
    throw new Error('NETLIFY=true detected. Railway full-platform simulation must not run with NETLIFY.');
  }

  console.log('\n=== Railway Full-Platform Build Simulation ===');
  await preflightRestore();

  run('pnpm run build', {
    RAILWAY: 'true',
    NETLIFY: 'false',
    NODE_OPTIONS: '--max-old-space-size=7168 --max-semi-space-size=64',
    NEXT_PRIVATE_WORKERS_PER_JOB: '1',
    NEXT_PRIVATE_BUILD_WORKER_COUNT: '1',
  });
  await assertManifestHasOperationalRoutes();

  console.log('\n✅ Railway full-platform build simulation passed.');
}

try {
  await main();
} catch (err) {
  console.error(`\n❌ ${err.message}`);
  await preflightRestore();
  process.exit(1);
} finally {
  await preflightRestore();
}
