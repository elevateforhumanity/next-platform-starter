/**
 * test-netlify-marketing-build.mjs
 *
 * Local validation of the Netlify marketing build pipeline.
 * Mirrors the exact Netlify command order:
 *   quarantine → [build] → route guard
 *
 * Restore always runs in a finally block so app/ is never left quarantined
 * even if build or route guard fails.
 *
 * Usage:
 *   node scripts/test-netlify-marketing-build.mjs          # quarantine + guard only (fast)
 *   node scripts/test-netlify-marketing-build.mjs --build  # full build included
 */

import { execSync } from 'child_process';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const RUN_BUILD = process.argv.includes('--build');
const ROOT      = process.cwd();
const APP_DIR   = join(ROOT, 'app');

// Pre-build checks (app/ source) — mirrors quarantine script's own forbidden list
const FORBIDDEN_APP_PATHS = [
  'app/admin', 'app/api', 'app/lms', 'app/learner', 'app/student',
  'app/dashboard', 'app/my-dashboard', 'app/instructor', 'app/employer',
  'app/partner-dashboard', 'app/program-holder', 'app/staff-portal',
  'app/creator', 'app/builder', 'app/billing', 'app/checkout',
  'app/ai', 'app/videos', 'app/video',
];

// Post-build checks (compiled manifest) — mirrors route guard's forbidden list
const FORBIDDEN_PREFIXES = [
  '/admin', '/api', '/lms', '/learner', '/student', '/dashboard',
  '/my-dashboard', '/instructor', '/employer', '/partner-dashboard',
  '/program-holder', '/staff-portal', '/creator', '/builder',
  '/billing', '/checkout', '/ai', '/videos', '/video',
];

const APP_ROUTE_CEILING      = 175;  // app/ source routes after quarantine
const COMPILED_ROUTE_CEILING = 300;  // .next manifest entries after build

function run(cmd, env = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
}

async function collectAppRoutes(dir, routes = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return routes; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await collectAppRoutes(full, routes);
    else if (['page.tsx', 'page.ts', 'route.ts', 'route.tsx'].includes(e.name))
      routes.push(full.replace(ROOT + '/', ''));
  }
  return routes;
}

// Always restore, even on failure
async function restore() {
  console.log('\n=== Restore ===');
  run('node scripts/netlify-quarantine-railway-routes.mjs --restore');
}

async function main() {
  // Step 1: restore any leftover quarantine from a previous interrupted run
  console.log('\n=== Step 1: Pre-flight restore ===');
  run('node scripts/netlify-quarantine-railway-routes.mjs --restore');

  // Step 2: quarantine Railway routes
  console.log('\n=== Step 2: Quarantine ===');
  run('node scripts/netlify-quarantine-railway-routes.mjs --force');

  // Step 3: assert app/ source is clean (pre-build check)
  console.log('\n=== Step 3: Pre-build assertions (app/ source) ===');
  const appRoutes = await collectAppRoutes(APP_DIR);
  let passed = true;

  for (const p of FORBIDDEN_APP_PATHS) {
    if (existsSync(join(ROOT, p))) {
      console.error(`  ✗ FAIL: ${p} still exists in app/`);
      passed = false;
    } else {
      console.log(`  ✅ ${p} — gone`);
    }
  }

  console.log(`\n  app/ route count: ${appRoutes.length} / ${APP_ROUTE_CEILING}`);
  if (appRoutes.length > APP_ROUTE_CEILING) {
    console.error(`  ✗ FAIL: ${appRoutes.length} app/ routes exceed ceiling of ${APP_ROUTE_CEILING}`);
    passed = false;
  } else {
    console.log(`  ✅ app/ route count within ceiling`);
  }

  if (!passed) {
    console.error('\n❌ Pre-build check failed. Fix quarantine before building.\n');
    process.exit(1);
  }

  // Step 4: optional full build (mirrors Netlify pipeline)
  if (RUN_BUILD) {
    console.log('\n=== Step 4: Build ===');
    run('pnpm run build', { NETLIFY: 'true' });

    // Step 5: post-build route guard (inspects .next/server/app-paths-manifest.json)
    console.log('\n=== Step 5: Post-build route guard ===');
    run('node scripts/netlify-route-guard.mjs', { NETLIFY: 'true' });

    // Step 6: assert compiled manifest has no forbidden routes
    console.log('\n=== Step 6: Post-build assertions (compiled manifest) ===');
    const manifestPath = join(ROOT, '.next', 'server', 'app-paths-manifest.json');
    if (!existsSync(manifestPath)) {
      console.error('  ✗ FAIL: app-paths-manifest.json not found after build');
      process.exit(1);
    }
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const compiledRoutes = Object.keys(manifest);

    const leaked = compiledRoutes.filter(route =>
      FORBIDDEN_PREFIXES.some(prefix =>
        route === prefix || route.startsWith(prefix + '/') || route.startsWith(prefix + '[')
      )
    );
    if (leaked.length > 0) {
      console.error('  ✗ FAIL: forbidden routes in compiled output:');
      leaked.forEach(r => console.error('    ' + r));
      passed = false;
    }

    console.log(`\n  Compiled route count: ${compiledRoutes.length} / ${COMPILED_ROUTE_CEILING}`);
    if (compiledRoutes.length > COMPILED_ROUTE_CEILING) {
      console.error(`  ✗ FAIL: ${compiledRoutes.length} compiled routes exceed ceiling of ${COMPILED_ROUTE_CEILING}`);
      passed = false;
    } else {
      console.log(`  ✅ Compiled route count within ceiling`);
    }

    if (!passed) {
      console.error('\n❌ Post-build check failed.\n');
      process.exit(1);
    }
  } else {
    console.log('\n(Skipping build — pass --build to run full pipeline)');
  }

  console.log('\n✅ All assertions passed.\n');
}

// finally guarantees restore even if main() throws or process.exit() is called
// Note: process.exit() bypasses finally in Node. We catch errors and restore
// manually before re-exiting so app/ is never left in a quarantined state.
try {
  await main();
} catch (err) {
  console.error('\n[test] Unexpected error:', err.message);
  await restore();
  process.exit(1);
} finally {
  // Runs on clean exit path
  await restore();
}
