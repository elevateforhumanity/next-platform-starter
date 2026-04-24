/**
 * netlify-route-guard.mjs
 *
 * Runs AFTER quarantine, BEFORE `next build` on Netlify.
 * Hard-fails the build if any Railway-only route is still visible under app/.
 */

import { existsSync } from 'fs';

if (!process.env.NETLIFY) {
  console.log('[route-guard] Not on Netlify — skipping.');
  process.exit(0);
}

// Must match RAILWAY_DIRS in netlify-quarantine-railway-routes.mjs exactly.
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
];

const leaked = MUST_NOT_EXIST.filter(d => existsSync(d));

if (leaked.length > 0) {
  console.error('\n[route-guard] HARD FAIL — Railway routes still visible to Next.js:');
  leaked.forEach(d => console.error('  ' + d));
  console.error('\nAdd them to RAILWAY_DIRS in scripts/netlify-quarantine-railway-routes.mjs\n');
  process.exit(1);
}

console.log('[route-guard] All Railway routes quarantined. Netlify sees marketing only.');
