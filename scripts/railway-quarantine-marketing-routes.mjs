/**
 * railway-quarantine-marketing-routes.mjs
 *
 * Runs BEFORE `next build` on Railway only (RAILWAY=true).
 *
 * ALLOWLIST MODEL: every app/ directory NOT in RAILWAY_DIRS is moved into
 * .railway-quarantine/ before Next.js route discovery runs. Railway only
 * compiles LMS, admin, instructor, learner, API, and auth routes.
 *
 * Usage:
 *   node scripts/railway-quarantine-marketing-routes.mjs           # quarantine
 *   node scripts/railway-quarantine-marketing-routes.mjs --restore # restore
 */

import { rename, mkdir, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const RESTORE = process.argv.includes('--restore');

if (!process.env.RAILWAY && !RESTORE) {
  console.log('[railway-quarantine] Not on Railway — skipping.');
  process.exit(0);
}

const QUARANTINE_ROOT = '.railway-quarantine';

// ── ALLOWLIST: directories Railway is allowed to compile ─────────────────────
// Everything else (marketing pages) is quarantined automatically.
const RAILWAY_DIRS = new Set([
  // ── Next.js internals ─────────────────────────────────────────────────────
  '(auth)',
  '(dashboard)',
  '(marketing)',
  '(partner)',
  '(public)',
  '.well-known',
  '_data',
  'actions',
  'components',
  'data',
  'layouts',

  // ── Auth (needed by all Railway portals) ──────────────────────────────────
  'login',
  'signup',
  'forgot-password',
  'reset',
  'reset-password',
  'verify-email',
  'accept-invite',
  'unauthorized',
  'auth',
  'billing-required',

  // ── LMS / student-facing ──────────────────────────────────────────────────
  'lms',
  'learner',
  'courses',
  'course-preview',
  'my-dashboard',
  'dashboard',
  'onboarding',
  'orientation',
  'student',
  'student-portal',

  // ── Admin / internal ──────────────────────────────────────────────────────
  'admin',
  'staff-portal',
  'case-manager',
  'proctor',
  'builder',
  'creator',
  'generate',
  'reports',
  'approvals',

  // ── Instructor / employer / partner portals ───────────────────────────────
  'instructor',
  'employer',
  'employer-portal',
  'partner',
  'partner-portal',
  'program-holder',
  'mentor',
  'workforce-board',

  // ── Authenticated user flows ──────────────────────────────────────────────
  'account',
  'profile',
  'settings',
  'billing',
  'checkout',
  'pay',
  'payment',
  'enroll',
  'enrollment',
  'messages',
  'notifications',
  'search',
  'certificates',
  'credentials',
  'achievements',
  'transcript',
  'advising',
  'next-steps',
  'sign',
  'documents',
  'compliance',
  'apprentice',
  'schedule',
  'portals',

  // ── All API routes ────────────────────────────────────────────────────────
  'api',

  // ── Internal tools ────────────────────────────────────────────────────────
  'supersonic',
  'tax',
  'pwa',
  'videos',
  'video',
  'demos',
  'ai',
  'ai-chat',
  'ai-studio',
  'ai-tutor',
  'testing',
  'store',
  'shop',
]);

async function quarantine() {
  const entries = await readdir('app');
  const toMove = [];

  for (const entry of entries) {
    if (RAILWAY_DIRS.has(entry)) continue;
    const src = join('app', entry);
    try {
      const s = await stat(src);
      if (s.isDirectory()) toMove.push(entry);
    } catch { /* skip */ }
  }

  console.log(`[railway-quarantine] ${entries.length} entries in app/ — quarantining ${toMove.length} marketing dirs...`);
  let moved = 0;

  for (const entry of toMove) {
    const src = join('app', entry);
    const dest = join(QUARANTINE_ROOT, 'app', entry);
    await mkdir(dirname(dest), { recursive: true });
    await rename(src, dest);
    console.log(`  ✓ ${src}`);
    moved++;
  }

  console.log(`[railway-quarantine] Done — quarantined ${moved} marketing dirs. Railway sees ${entries.length - moved} entries.`);
}

async function restore() {
  const quarantinedApp = join(QUARANTINE_ROOT, 'app');
  if (!existsSync(quarantinedApp)) {
    console.log('[railway-quarantine] Nothing to restore.');
    return;
  }
  const entries = await readdir(quarantinedApp);
  console.log(`[railway-quarantine] Restoring ${entries.length} dirs...`);
  let restored = 0;
  for (const entry of entries) {
    const src = join(quarantinedApp, entry);
    const dest = join('app', entry);
    await mkdir(dirname(dest), { recursive: true });
    await rename(src, dest);
    restored++;
  }
  console.log(`[railway-quarantine] Restored ${restored} directories.`);
}

if (RESTORE) {
  await restore();
} else {
  await quarantine();
}
