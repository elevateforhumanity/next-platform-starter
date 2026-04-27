/**
 * netlify-route-guard.mjs
 *
 * Runs AFTER pnpm run build on Netlify.
 * Inspects .next/server/app-paths-manifest.json — the actual compiled route
 * manifest — to confirm no Railway-only routes leaked into the build output.
 *
 * Hard-fails if any forbidden route segment appears in the manifest, or if
 * the total compiled route count exceeds the marketing ceiling.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

if (!process.env.NETLIFY) {
  console.log('[route-guard] Not on Netlify — skipping.');
  process.exit(0);
}

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, '.next', 'server', 'app-paths-manifest.json');

// Hard ceiling — marketing site has ~150 real routes. 300 gives headroom for
// dynamic segments that expand in the manifest (e.g. [slug] variants).
// If this trips, the quarantine is leaking — fix the allowlist, not the ceiling.
const ROUTE_CEILING = 300;

// Forbidden first path segments that must not appear in compiled output.
const FORBIDDEN_PREFIXES = [
  '/admin',
  '/api',
  '/lms',
  '/learner',
  '/student',
  '/dashboard',
  '/my-dashboard',
  '/instructor',
  '/employer-portal',
  '/employer/', // /employer/* sub-routes (not /employers which is public)
  '/partner-dashboard',
  '/program-holder',
  '/staff-portal',
  '/case-manager',
  '/proctor',
  '/creator',
  '/builder',
  '/generate',
  '/reports',
  '/approvals',
  '/account',
  '/profile',
  '/settings',
  '/billing',
  '/checkout',
  '/pay',
  '/payment',
  '/enroll',
  '/enrollment',
  '/messages',
  '/notifications',
  '/certificates',
  '/credentials',
  '/transcript',
  '/advising',
  '/documents',
  '/compliance',
  '/apprentice',
  '/schedule',
  '/videos',
  '/video',
  '/ai',
  '/ai-chat',
  '/ai-studio',
  '/ai-tutor',
  '/supersonic',
  '/tax',
  '/pwa',
];

// Check manifest exists — if build failed or wasn't run, fail clearly.
if (!existsSync(MANIFEST_PATH)) {
  console.error('[route-guard] HARD FAIL — .next/server/app-paths-manifest.json not found.');
  console.error('  Run pnpm run build before the route guard.');
  process.exit(1);
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const compiledRoutes = Object.keys(manifest);

let failed = false;

// Check 1: forbidden prefixes in compiled output
const leaked = compiledRoutes.filter((route) =>
  FORBIDDEN_PREFIXES.some(
    (prefix) =>
      route === prefix || route.startsWith(prefix + '/') || route.startsWith(prefix + '['),
  ),
);

if (leaked.length > 0) {
  console.error('\n[route-guard] HARD FAIL — forbidden routes in compiled output:');
  leaked.forEach((r) => console.error('  ✗ ' + r));
  failed = true;
}

// Check 2: compiled route count ceiling
console.log(`\n[route-guard] Compiled routes: ${compiledRoutes.length}`);

if (compiledRoutes.length > ROUTE_CEILING) {
  console.error(
    `\n[route-guard] HARD FAIL — ${compiledRoutes.length} compiled routes exceed ceiling of ${ROUTE_CEILING}`,
  );
  console.error('Quarantine is leaking Railway routes. Fix the allowlist.');
  failed = true;
}

if (failed) {
  console.error('\n[route-guard] Build aborted. Quarantine did not run or is leaking.\n');
  process.exit(1);
}

console.log(
  `[route-guard] ✅ ${compiledRoutes.length}/${ROUTE_CEILING} compiled routes — all clean. No Railway routes in build output.\n`,
);
