/**
 * netlify-route-guard.mjs
 *
 * Runs AFTER quarantine, BEFORE next build on Netlify.
 * Hard-fails if any forbidden route is still visible or route count exceeds ceiling.
 */

import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

if (!process.env.NETLIFY) {
  console.log('[route-guard] Not on Netlify — skipping.');
  process.exit(0);
}

const ROOT    = process.cwd();
const APP_DIR = join(ROOT, 'app');

// Hard ceiling — marketing site has ~100 real routes. 175 gives headroom.
const ROUTE_CEILING = 175;

// Forbidden top-level paths that must not exist after quarantine
const FORBIDDEN_PATHS = [
  'app/admin', 'app/api', 'app/lms', 'app/learner', 'app/student',
  'app/dashboard', 'app/my-dashboard', 'app/instructor', 'app/employer',
  'app/partner-dashboard', 'app/program-holder', 'app/staff-portal',
  'app/case-manager', 'app/proctor', 'app/creator', 'app/builder',
  'app/generate', 'app/reports', 'app/approvals', 'app/account',
  'app/profile', 'app/settings', 'app/billing', 'app/checkout',
  'app/pay', 'app/payment', 'app/enroll', 'app/enrollment',
  'app/messages', 'app/notifications', 'app/certificates', 'app/credentials',
  'app/transcript', 'app/advising', 'app/documents', 'app/compliance',
  'app/apprentice', 'app/schedule', 'app/videos', 'app/video',
  'app/ai', 'app/ai-chat', 'app/ai-studio', 'app/ai-tutor',
  'app/supersonic', 'app/tax', 'app/pwa',
];

// Forbidden segments that must not appear anywhere in route paths
const FORBIDDEN_SEGMENTS = new Set([
  'admin', 'api', 'lms', 'learner', 'student', 'dashboard', 'my-dashboard',
  'instructor', 'employer', 'partner-dashboard', 'program-holder', 'staff-portal',
  'case-manager', 'proctor', 'creator', 'builder', 'generate', 'reports',
  'approvals', 'account', 'profile', 'settings', 'billing', 'checkout', 'pay',
  'payment', 'enroll', 'enrollment', 'messages', 'notifications', 'certificates',
  'credentials', 'transcript', 'advising', 'documents', 'compliance', 'apprentice',
  'schedule', 'videos', 'video', 'ai', 'ai-chat', 'ai-studio', 'ai-tutor',
  'supersonic', 'tax', 'pwa',
]);

async function collectRoutes(dir, routes = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return routes; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await collectRoutes(full, routes);
    } else if (['page.tsx','page.ts','route.ts','route.tsx'].includes(e.name)) {
      routes.push(full.replace(ROOT + '/', ''));
    }
  }
  return routes;
}

let failed = false;

// Check 1: forbidden top-level paths
const leaked = FORBIDDEN_PATHS.filter(p => existsSync(join(ROOT, p)));
if (leaked.length > 0) {
  console.error('\n[route-guard] HARD FAIL — forbidden paths still visible:');
  leaked.forEach(p => console.error('  ✗ ' + p));
  failed = true;
}

// Check 2: collect all routes and scan for forbidden segments
const routes = await collectRoutes(APP_DIR);
const forbiddenRoutes = routes.filter(r => {
  const parts = r.split('/');
  return parts.some(p => FORBIDDEN_SEGMENTS.has(p));
});

if (forbiddenRoutes.length > 0) {
  console.error('\n[route-guard] HARD FAIL — forbidden segments in routes:');
  forbiddenRoutes.forEach(r => console.error('  ✗ ' + r));
  failed = true;
}

// Check 3: route count ceiling
console.log(`\n[route-guard] Visible routes (${routes.length}):`);
routes.forEach(r => console.log('  ' + r));

if (routes.length > ROUTE_CEILING) {
  console.error(`\n[route-guard] HARD FAIL — ${routes.length} routes exceed ceiling of ${ROUTE_CEILING}`);
  console.error('Quarantine is leaking Railway routes. Fix the allowlist.');
  failed = true;
}

if (failed) {
  console.error('\n[route-guard] Build aborted. Run quarantine script first.\n');
  process.exit(1);
}

console.log(`\n[route-guard] ✅ ${routes.length}/${ROUTE_CEILING} routes — all clean. Netlify sees marketing only.\n`);
