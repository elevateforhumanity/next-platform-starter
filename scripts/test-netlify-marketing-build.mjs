/**
 * test-netlify-marketing-build.mjs
 *
 * Local validation of the Netlify marketing build pipeline.
 * Does NOT run a full build unless --build is passed.
 *
 * Usage:
 *   node scripts/test-netlify-marketing-build.mjs
 *   node scripts/test-netlify-marketing-build.mjs --build
 */

import { execSync } from 'child_process';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const RUN_BUILD = process.argv.includes('--build');
const ROOT      = process.cwd();
const APP_DIR   = join(ROOT, 'app');

const FORBIDDEN_PATHS = [
  'app/admin', 'app/api', 'app/lms', 'app/learner', 'app/student',
  'app/dashboard', 'app/my-dashboard', 'app/instructor', 'app/employer',
  'app/program-holder', 'app/staff-portal', 'app/billing', 'app/checkout',
];

const FORBIDDEN_SEGMENTS = new Set([
  'admin', 'api', 'lms', 'learner', 'student', 'dashboard', 'my-dashboard',
  'instructor', 'employer', 'program-holder', 'staff-portal', 'billing',
  'checkout', 'enrollment', 'certificates', 'credentials',
]);

const ROUTE_CEILING = 175;

function run(cmd, env = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
}

async function collectRoutes(dir, routes = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return routes; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await collectRoutes(full, routes);
    else if (['page.tsx','page.ts','route.ts','route.tsx'].includes(e.name))
      routes.push(full.replace(ROOT + '/', ''));
  }
  return routes;
}

// Step 1: restore any existing quarantine
console.log('\n=== Step 1: Restore ===');
run('node scripts/netlify-quarantine-railway-routes.mjs --restore');

// Step 2: quarantine
console.log('\n=== Step 2: Quarantine ===');
run('node scripts/netlify-quarantine-railway-routes.mjs --force');

// Step 3: guard
console.log('\n=== Step 3: Route guard ===');
run('node scripts/netlify-route-guard.mjs', { NETLIFY: 'true' });

// Step 4: assertions
console.log('\n=== Step 4: Assertions ===');
const routes = await collectRoutes(APP_DIR);
let passed = true;

// Check forbidden paths gone
for (const p of FORBIDDEN_PATHS) {
  if (existsSync(join(ROOT, p))) {
    console.error(`  ✗ FAIL: ${p} still exists`);
    passed = false;
  } else {
    console.log(`  ✅ ${p} — gone`);
  }
}

// Check no forbidden segments in routes
const badRoutes = routes.filter(r => r.split('/').some(s => FORBIDDEN_SEGMENTS.has(s)));
if (badRoutes.length > 0) {
  console.error('  ✗ FAIL: forbidden segments in routes:');
  badRoutes.forEach(r => console.error('    ' + r));
  passed = false;
}

// Check route count
console.log(`\n  Route count: ${routes.length} / ${ROUTE_CEILING}`);
if (routes.length > ROUTE_CEILING) {
  console.error(`  ✗ FAIL: ${routes.length} routes exceed ceiling of ${ROUTE_CEILING}`);
  passed = false;
} else {
  console.log(`  ✅ Route count within ceiling`);
}

if (!passed) {
  console.error('\n❌ Test failed. Fix quarantine before pushing.\n');
  process.exit(1);
}

console.log('\n✅ All assertions passed.\n');

// Step 5: optional full build
if (RUN_BUILD) {
  console.log('\n=== Step 5: Full build ===');
  run('pnpm run build', { NETLIFY: 'true' });
}

// Always restore after test
console.log('\n=== Restore after test ===');
run('node scripts/netlify-quarantine-railway-routes.mjs --restore');
