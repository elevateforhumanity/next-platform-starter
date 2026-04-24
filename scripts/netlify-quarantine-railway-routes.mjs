/**
 * netlify-quarantine-railway-routes.mjs
 *
 * Runs BEFORE `next build` on Netlify only.
 *
 * ALLOWLIST MODEL: every app/ directory NOT in MARKETING_DIRS is moved into
 * .netlify-quarantine/ before Next.js route discovery runs. Resilient by
 * default — new Railway directories are quarantined automatically.
 *
 * Usage:
 *   node scripts/netlify-quarantine-railway-routes.mjs           # quarantine
 *   node scripts/netlify-quarantine-railway-routes.mjs --restore # restore
 */

import { rename, mkdir, readdir, stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const RESTORE = process.argv.includes('--restore');

if (!process.env.NETLIFY && !RESTORE) {
  console.log('[quarantine] Not on Netlify — skipping. Pass --restore to undo locally.');
  process.exit(0);
}

const QUARANTINE_ROOT = '.netlify-quarantine';

// ── ALLOWLIST ─────────────────────────────────────────────────────────────────
// ONLY these top-level app/ directories compile on Netlify.
// Everything else is quarantined automatically — no maintenance needed for
// new Railway routes.
//
// Rule for adding a dir here:
//   - Must be purely public/unauthenticated content
//   - Must not import admin/LMS/API logic
//   - Must not have Railway-only sub-routes mixed in
//   - If in doubt, leave it out (Railway will serve it)
const MARKETING_DIRS = new Set([
  // ── Next.js internals / route groups / special dirs ──────────────────────
  '(auth)',
  '(marketing)',
  '(public)',
  '.well-known',
  '_data',
  'actions',
  'components',
  'data',
  'layouts',

  // ── Auth entry points (public login/signup only) ──────────────────────────
  'login',
  'signup',
  'forgot-password',
  'reset',
  'reset-password',
  'verify-email',
  'accept-invite',
  'unauthorized',
  'auth',

  // ── Core marketing pages ──────────────────────────────────────────────────
  'about',
  'accreditation',
  'accessibility',
  'check-eligibility',
  'contact',
  'how-it-works',
  'locations',
  'outcomes',
  'programs',       // public program catalog — ISR, read-only Supabase
  'testing',        // certification testing info pages
  'testimonials',

  // ── Legal / compliance docs (public, static) ──────────────────────────────
  'attendance-policy',
  'cookies',
  'disclosures',
  'dmca',
  'enrollment-agreement',
  'equal-opportunity',
  'federal-compliance',
  'governance',
  'grievance',
  'instructional-framework',
  'privacy',
  'privacy-policy',
  'refund-policy',
  'satisfactory-academic-progress',
  'security',
  'terms',
  'terms-of-service',

  // ── Funding / partner info (public, read-only) ────────────────────────────
  'apprenticeship-sponsor',
  'apprenticeships',
  'career-training',
  'cna-waitlist',
  'community-services',
  'employment-support',
  'faq',
  'financial-aid',
  'financing',
  'for-agencies',
  'for-employers',
  'fssa',
  'fssa-impact',
  'fssa-partnership-request',
  'grants',
  'help',
  'hire-graduates',
  'inquiry',
  'instructor-credentials',
  'jri',
  'ojt-and-funding',
  'partner-with-us',
  'pricing',
  'resources',
  'snap-et-partner',
  'start',
  'student-handbook',
  'success-stories',
  'tuition',
  'tuition-fees',
  'verify',
  'verify-credential',
  'verify-credentials',
  'webinars',
  'wioa-eligibility',
  'workone-partner-packet',

  // ── Misc public pages ─────────────────────────────────────────────────────
  'agencies',
  'alumni',
  'booking',
  'booth-rental',
  'c',
  'calendar',
  'careers',
  'cert',
  'certiport-exam',
  'ebook',
  'employers',
  'events',
  'microclasses',
  'mobile',
  'mobile-app',
  'success',
  'training',
  'webinars',
]);

async function quarantine() {
  const entries = await readdir('app');
  const toMove = [];

  for (const entry of entries) {
    if (MARKETING_DIRS.has(entry)) continue;
    const src = join('app', entry);
    try {
      const s = await stat(src);
      if (s.isDirectory()) toMove.push(entry);
    } catch { /* skip */ }
  }

  console.log(`[quarantine] ${entries.length} entries in app/ — quarantining ${toMove.length} Railway-only dirs...`);
  let moved = 0;

  for (const entry of toMove) {
    const src = join('app', entry);
    const dest = join(QUARANTINE_ROOT, 'app', entry);
    await mkdir(dirname(dest), { recursive: true });
    await rename(src, dest);
    console.log(`  ✓ ${src}`);
    moved++;
  }

  const remaining = entries.length - moved;
  console.log(`[quarantine] Done — quarantined ${moved} dirs. Netlify sees ${remaining} entries.`);
}

async function restore() {
  const quarantinedApp = join(QUARANTINE_ROOT, 'app');
  if (!existsSync(quarantinedApp)) {
    console.log('[quarantine] Nothing to restore.');
    return;
  }
  const entries = await readdir(quarantinedApp);
  console.log(`[quarantine] Restoring ${entries.length} dirs...`);
  let restored = 0;
  for (const entry of entries) {
    const src = join(quarantinedApp, entry);
    const dest = join('app', entry);
    await mkdir(dirname(dest), { recursive: true });
    await rename(src, dest);
    restored++;
  }
  console.log(`[quarantine] Restored ${restored} directories.`);
}

if (RESTORE) {
  await restore();
} else {
  await quarantine();
}
