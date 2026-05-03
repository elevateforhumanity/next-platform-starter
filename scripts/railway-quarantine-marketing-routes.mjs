/**
 * railway-quarantine-marketing-routes.mjs
 *
 * Runs BEFORE `next build` on Railway only (RAILWAY=true).
 *
 * ALLOWLIST MODEL: every app/ directory NOT in the active role's allowlist
 * is moved into .railway-quarantine/ before Next.js route discovery runs.
 * This keeps compiled page count to ~200-300 instead of ~1,500.
 *
 * SERVICE_ROLE env var selects the allowlist:
 *   SERVICE_ROLE=lms   — LMS, learner, student portals + shared auth/API
 *   SERVICE_ROLE=admin — Admin, instructor, staff portals + shared auth/API
 *   (unset)            — full Railway allowlist (both roles combined)
 *
 * Usage:
 *   node scripts/railway-quarantine-marketing-routes.mjs           # quarantine
 *   node scripts/railway-quarantine-marketing-routes.mjs --restore # restore
 */

import { rename, mkdir, readdir, stat, cp, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

async function moveDir(src, dest) {
  await mkdir(dirname(dest), { recursive: true });
  try {
    await rename(src, dest);
  } catch (e) {
    if (e.code === 'EXDEV') {
      await cp(src, dest, { recursive: true });
      await rm(src, { recursive: true, force: true });
    } else {
      throw e;
    }
  }
}

const RESTORE = process.argv.includes('--restore');

if (!process.env.RAILWAY && !RESTORE) {
  console.log('[railway-quarantine] Not on Railway — skipping.');
  process.exit(0);
}

const QUARANTINE_ROOT = '.railway-quarantine';
const SERVICE_ROLE = process.env.SERVICE_ROLE || 'all';

// Shared: needed by every Railway service
const SHARED = [
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
  'login',
  'admin-login',
  'signup',
  'forgot-password',
  'reset',
  'reset-password',
  'verify-email',
  'accept-invite',
  'unauthorized',
  'auth',
  'billing-required',
  'api',
];

// LMS service: learner-facing routes + public marketing pages
// Marketing pages must be included here because www.elevateforhumanity.org
// routes to this ECS service — Netlify no longer serves the public site.
const LMS_ONLY = [
  // ── LMS / learner ──────────────────────────────────────────────────────────
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
  'videos',
  'video',
  'ai',
  'ai-chat',
  'ai-studio',
  'ai-tutor',
  // ── Public marketing (served from www.elevateforhumanity.org via ECS) ──────
  'about',
  'accreditation',
  'accessibility',
  'agencies',
  'apply',
  'apprenticeships',
  'blog',
  'careers',
  'contact',
  'faq',
  'financial-aid',
  'grants',
  'home',
  'partners',
  'pricing',
  'programs',
  'scholarships',
  'sitemap',
  'team',
  'verify',
  'workforce',
];

// Admin service: staff-facing routes
const ADMIN_ONLY = [
  'admin',
  'staff-portal',
  'case-manager',
  'proctor',
  'builder',
  'creator',
  'generate',
  'reports',
  'approvals',
  'instructor',
  'employer',
  'employer-portal',
  'partner',
  'partner-portal',
  'program-holder',
  'mentor',
  'workforce-board',
  'account',
  'profile',
  'settings',
  'messages',
  'notifications',
  'search',
  'documents',
  'compliance',
  'supersonic',
  'tax',
  'store',
  'shop',
  'demos',
  'testing',
  'pwa',
];

function getAllowlist() {
  switch (SERVICE_ROLE) {
    case 'lms':
      return new Set([...SHARED, ...LMS_ONLY]);
    case 'admin':
      return new Set([...SHARED, ...ADMIN_ONLY]);
    default:
      return new Set([...SHARED, ...LMS_ONLY, ...ADMIN_ONLY]);
  }
}

async function quarantine() {
  const allowlist = getAllowlist();
  const entries = await readdir('app');
  const toMove = [];

  for (const entry of entries) {
    if (allowlist.has(entry)) continue;
    const src = join('app', entry);
    try {
      const s = await stat(src);
      if (s.isDirectory()) toMove.push(entry);
    } catch {
      /* skip */
    }
  }

  console.log(`[railway-quarantine] SERVICE_ROLE=${SERVICE_ROLE}`);
  console.log(
    `[railway-quarantine] ${entries.length} entries in app/ — quarantining ${toMove.length} marketing dirs...`,
  );

  for (const entry of toMove) {
    await moveDir(join('app', entry), join(QUARANTINE_ROOT, 'app', entry));
    console.log(`  ✓ app/${entry}`);
  }

  console.log(
    `[railway-quarantine] Done — ${entries.length - toMove.length} dirs remain for compilation.`,
  );
}

async function restore() {
  const quarantinedApp = join(QUARANTINE_ROOT, 'app');
  if (!existsSync(quarantinedApp)) {
    console.log('[railway-quarantine] Nothing to restore.');
    return;
  }
  const entries = await readdir(quarantinedApp);
  console.log(`[railway-quarantine] Restoring ${entries.length} dirs...`);
  for (const entry of entries) {
    await moveDir(join(quarantinedApp, entry), join('app', entry));
  }
  console.log(`[railway-quarantine] Restored ${entries.length} directories.`);
}

if (RESTORE) {
  await restore();
} else {
  await quarantine();
}
