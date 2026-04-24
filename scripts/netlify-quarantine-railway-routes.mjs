/**
 * netlify-quarantine-railway-routes.mjs
 *
 * Runs BEFORE `next build` on Netlify only.
 *
 * Physically moves Railway-only app/ directories into .netlify-quarantine/
 * so Next.js route discovery never sees them. This is the only reliable way
 * to prevent Next.js from compiling Railway routes — it scans app/ at startup,
 * before any webpack plugin can intervene.
 *
 * Safe: moves, never deletes. Netlify CI always starts from a fresh clone so
 * restore is not needed. For local use, run with --restore to move them back.
 *
 * Usage:
 *   node scripts/netlify-quarantine-railway-routes.mjs           # quarantine
 *   node scripts/netlify-quarantine-railway-routes.mjs --restore # restore
 */

import { rename, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const RESTORE = process.argv.includes('--restore');

// Only run on Netlify unless --restore is passed (for local recovery)
if (!process.env.NETLIFY && !RESTORE) {
  console.log('[quarantine] Not on Netlify — skipping. Pass --restore to undo locally.');
  process.exit(0);
}

const QUARANTINE_ROOT = '.netlify-quarantine';

// Every app/ directory that belongs to Railway.
// Netlify must never compile these. Keep this list in sync with
// netlify-route-guard.mjs.
const RAILWAY_DIRS = [
  // ── Admin / internal ──────────────────────────────────────────────────────
  'app/admin',
  'app/api',           // ALL api routes — Railway owns every API endpoint
  'app/builder',
  'app/creator',
  'app/generate',
  'app/reports',
  'app/approvals',
  'app/staff-portal',
  'app/case-manager',
  'app/proctor',

  // ── LMS / student-facing ──────────────────────────────────────────────────
  'app/lms',
  'app/learner',
  'app/courses',
  'app/course-preview',
  'app/my-dashboard',
  'app/dashboard',
  'app/onboarding',
  'app/orientation',

  // ── Instructor / employer / partner portals ───────────────────────────────
  'app/instructor',
  'app/employer',
  'app/employer-portal',
  'app/partner',
  'app/partner-portal',
  'app/program-holder',
  'app/mentor',
  'app/workforce-board',

  // ── Authenticated user flows ──────────────────────────────────────────────
  'app/account',
  'app/profile',
  'app/settings',
  'app/billing',
  'app/billing-required',
  'app/checkout',
  'app/pay',
  'app/payment',
  'app/enroll',
  'app/enrollment',
  'app/messages',
  'app/notifications',
  'app/search',
  'app/certificates',
  'app/credentials',
  'app/achievements',
  'app/transcript',
  'app/advising',
  'app/next-steps',
  'app/sign',
  'app/documents',
  'app/compliance',
  'app/apprentice',
  'app/schedule',
  'app/student',
  'app/student-portal',

  // ── Heavy / internal tools ────────────────────────────────────────────────
  'app/supersonic',
  'app/tax',
  'app/pwa',
  'app/videos',
  'app/video',
  'app/demos',
  'app/ai',
  'app/ai-chat',
  'app/ai-studio',
  'app/ai-tutor',
];

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function quarantine() {
  console.log('[quarantine] Moving Railway-only routes out of app/ ...');
  let moved = 0;
  let skipped = 0;

  for (const src of RAILWAY_DIRS) {
    if (!await exists(src)) { skipped++; continue; }
    const dest = join(QUARANTINE_ROOT, src);
    await mkdir(dirname(dest), { recursive: true });
    await rename(src, dest);
    console.log(`  ✓ ${src} → ${dest}`);
    moved++;
  }

  console.log(`[quarantine] Done — moved ${moved}, skipped ${skipped} (already absent).`);
}

async function restore() {
  console.log('[quarantine] Restoring Railway routes back to app/ ...');
  let restored = 0;

  for (const src of RAILWAY_DIRS) {
    const quarantined = join(QUARANTINE_ROOT, src);
    if (!await exists(quarantined)) continue;
    await mkdir(dirname(src), { recursive: true });
    await rename(quarantined, src);
    console.log(`  ✓ ${quarantined} → ${src}`);
    restored++;
  }

  console.log(`[quarantine] Restored ${restored} directories.`);
}

if (RESTORE) {
  await restore();
} else {
  await quarantine();
}
