/**
 * netlify-route-guard.mjs
 *
 * Runs AFTER pnpm run build on Netlify.
 * Inspects .next/server/app-paths-manifest.json — the actual compiled route
 * manifest — to confirm no Railway-only routes leaked into the Netlify build.
 *
 * Architecture: Netlify hosts the public marketing surface. Railway hosts the
 * full platform (LMS, admin, employer portal, etc.). The quarantine script
 * (netlify-quarantine-railway-routes.mjs) removes Railway-only routes before
 * Next.js compiles. This guard verifies the quarantine worked.
 *
 * What this guard checks:
 *   ✓ No backend-only route prefixes appear in the compiled manifest
 *
 * What this guard does NOT check:
 *   ✗ Total route count — the platform grows legitimately. A ceiling is not a
 *     safety property. If the quarantine is working, the count is correct by
 *     definition. Use the forbidden-prefix check to detect leakage, not a
 *     headcount that becomes stale every sprint.
 *
 * Hard-fail conditions:
 *   - Manifest file missing (build didn't run)
 *   - A forbidden backend prefix appears in compiled output (quarantine leaked)
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

/**
 * Routes with these prefixes must never appear in the Netlify compiled output.
 * They belong exclusively to Railway (authenticated app, admin, API layer).
 *
 * Rules for adding to this list:
 *   - The route is authenticated-only with no public-facing variant
 *   - The route is proxied to Railway via netlify.toml [[redirects]]
 *   - The route would expose internal tooling or user data if served from Netlify CDN
 *
 * Rules for NOT adding to this list:
 *   - The route has a public landing page
 *   - The route is a marketing or informational page
 *   - You want to reduce the route count (that is not a safety concern)
 */
const FORBIDDEN_PREFIXES = [
  // Admin — proxied to Railway, must never compile on Netlify
  '/admin',
  // API routes — all server-side, Railway-only
  '/api',
  // Authenticated LMS app shell — Railway handles /lms/* after auth.
  // NOTE: /lms (public landing) and /lms/(public)/* (program catalog) are
  // intentionally on Netlify. /lms/(app)/* is quarantined by the quarantine script.
  // Do not add '/lms' here — it would block the public LMS surface.
  // Authenticated learner/student portals
  '/learner',
  '/student',
  // Internal dashboards
  '/dashboard',
  '/my-dashboard',
  // Role-specific portals — all authenticated
  // NOTE: /instructor (top-level only) is a public landing page — allowed on Netlify.
  // /instructor/* sub-pages are quarantined by netlify-quarantine-railway-routes.mjs.
  '/employer-portal',
  '/partner-dashboard',
  '/program-holder',
  '/staff-portal',
  '/case-manager',
  '/proctor',
  // Internal tooling
  '/creator',
  '/builder',
  '/generate',
  '/reports',
  '/approvals',
  // Authenticated user account pages
  '/account',
  '/profile',
  '/settings',
  '/billing',
  // Commerce — Railway-owned
  '/checkout',
  '/pay',
  '/payment',
  // Enrollment flow — authenticated
  '/enroll',
  '/enrollment',
  // Authenticated communication/notification pages
  '/messages',
  '/notifications',
  // Credential/transcript pages — authenticated
  '/certificates',
  '/credentials',
  '/transcript',
  // Advising/documents — authenticated
  '/advising',
  '/documents',
  // Compliance tooling — internal
  '/compliance',
  // Apprentice portal — authenticated
  '/apprentice',
  // Schedule — authenticated
  '/schedule',
  // Media/AI — Railway-only (heavy compute)
  '/videos',
  '/video',
  '/ai',
  '/ai-chat',
  '/ai-studio',
  '/ai-tutor',
  // Tax software — SupersonicFastCash, Railway-only
  '/supersonic',
  '/tax',
  // PWA shells — Railway-only native app wrappers
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

console.log(`\n[route-guard] Compiled routes: ${compiledRoutes.length}`);

// Check: forbidden prefixes in compiled output
const leaked = compiledRoutes.filter((route) =>
  FORBIDDEN_PREFIXES.some(
    (prefix) =>
      route === prefix ||
      route.startsWith(prefix + '/') ||
      route.startsWith(prefix + '['),
  ),
);

if (leaked.length > 0) {
  console.error('\n[route-guard] HARD FAIL — Railway-only routes leaked into Netlify build:');
  leaked.forEach((r) => console.error('  ✗ ' + r));
  console.error('\n  Fix: add the leaking top-level directory to the quarantine allowlist');
  console.error('  in scripts/netlify-quarantine-railway-routes.mjs, then redeploy.\n');
  process.exit(1);
}

console.log(
  `[route-guard] ✅ ${compiledRoutes.length} compiled routes — no Railway routes in Netlify build output.\n`,
);
