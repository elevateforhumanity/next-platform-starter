/**
 * netlify-route-guard.mjs
 *
 * Runs AFTER quarantine, BEFORE `next build` on Netlify.
 * Hard-fails the build on two conditions:
 *   1. Any known Railway-only directory is still visible under app/
 *   2. Total route count (page.tsx + route.ts) exceeds ROUTE_CEILING
 *
 * The route ceiling catches regressions that the directory check misses —
 * e.g. accidental imports, hidden dynamic routes, or new dirs not yet
 * added to the quarantine allowlist.
 */

import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

if (!process.env.NETLIFY) {
  console.log('[route-guard] Not on Netlify — skipping.');
  process.exit(0);
}

// Hard ceiling on total page.tsx + route.ts files visible to Next.js.
// Marketing site has ~150 real pages. Set ceiling at 300 to allow headroom
// for new marketing pages without false positives.
// If this trips, quarantine is leaking Railway routes.
const ROUTE_CEILING = 300;

// Railway-only directories that must never appear in app/ during Netlify build.
// This is a safety net — the allowlist quarantine should have removed them.
const MUST_NOT_EXIST = [
  'app/admin',
  'app/api',
  'app/lms',
  'app/learner',
  'app/instructor',
  'app/employer',
  'app/employer-portal',
  'app/partner',
  'app/partner-portal',
  'app/program-holder',
  'app/my-dashboard',
  'app/dashboard',
  'app/staff-portal',
  'app/case-manager',
  'app/builder',
  'app/creator',
  'app/onboarding',
  'app/student',
  'app/student-portal',
  'app/messages',
  'app/billing',
  'app/checkout',
  'app/certificates',
  'app/compliance',
  'app/supersonic',
  'app/tax',
  'app/videos',
  'app/video',
  'app/reports',
  'app/approvals',
];

// ── Check 1: known Railway dirs ───────────────────────────────────────────────
const leaked = MUST_NOT_EXIST.filter(d => existsSync(d));
if (leaked.length > 0) {
  console.error('\n[route-guard] HARD FAIL — Railway routes still visible to Next.js:');
  leaked.forEach(d => console.error('  ' + d));
  console.error('\nQuarantine allowlist is missing these dirs. Add them to MARKETING_DIRS');
  console.error('in scripts/netlify-quarantine-railway-routes.mjs if they are marketing,');
  console.error('or they will be auto-quarantined on the next run.\n');
  process.exit(1);
}

// ── Check 2: route count ceiling ─────────────────────────────────────────────
async function countRoutes(dir) {
  let count = 0;
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      count += await countRoutes(full);
    } else if (e.name === 'page.tsx' || e.name === 'route.ts') {
      count++;
    }
  }
  return count;
}

const routeCount = await countRoutes('app');
console.log(`[route-guard] Route count: ${routeCount} (ceiling: ${ROUTE_CEILING})`);

if (routeCount > ROUTE_CEILING) {
  console.error(`\n[route-guard] HARD FAIL — ${routeCount} routes exceed ceiling of ${ROUTE_CEILING}.`);
  console.error('Railway routes are leaking into the Netlify build.');
  console.error('Run: NETLIFY=true node scripts/netlify-quarantine-railway-routes.mjs');
  console.error('Then check which dirs were not quarantined.\n');
  process.exit(1);
}

console.log('[route-guard] All Railway routes quarantined. Netlify sees marketing only.');
