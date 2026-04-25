/**
 * netlify-quarantine-railway-routes.mjs
 *
 * Physically moves Railway-only app/ directories out before Next.js route
 * discovery runs. Uses an ALLOWLIST — everything not explicitly permitted
 * is quarantined automatically. New Railway routes are safe by default.
 *
 * Usage:
 *   NETLIFY=true node scripts/netlify-quarantine-railway-routes.mjs
 *   node scripts/netlify-quarantine-railway-routes.mjs --restore
 *   node scripts/netlify-quarantine-railway-routes.mjs --force   (local test)
 */

import { rename, mkdir, readdir, cp, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const RESTORE   = process.argv.includes('--restore');
const FORCE     = process.argv.includes('--force');
const IS_NETLIFY = process.env.NETLIFY === 'true' || FORCE;

if (!IS_NETLIFY && !RESTORE) {
  console.log('[quarantine] Not on Netlify — skipping. Use --force to run locally.');
  process.exit(0);
}

const ROOT           = process.cwd();
const APP_DIR        = join(ROOT, 'app');
const QUARANTINE_DIR = join(ROOT, '.netlify-quarantine', 'app');

// ALLOWLIST: top-level app/ directories Netlify may compile.
// Everything else is quarantined automatically.
// 'components' and 'actions' are shared infrastructure imported by layout.tsx —
// they contain no page.tsx/route.ts so Next.js does not treat them as routes.
const ALLOWED_TOP_LEVEL = new Set([
  'about', 'contact', 'programs', 'apply', 'check-eligibility',
  'eligibility', 'privacy', 'terms', 'accessibility', 'providers',
  'resources', 'funding', 'partners',
  // Auth entry points — static shells that compile cleanly on Netlify
  'login', 'signup',
  // Testing/credentialing — public marketing pages
  'testing',
  // Additional public pages found by exhaustive href scan
  'achievements', 'calendar', 'careers', 'certiport-exam', 'dmca', 'ebook',
  'enrollment-agreement', 'equal-opportunity', 'locations', 'next-steps',
  'platform', 'policies', 'search', 'security', 'training',
  // Public marketing pages linked from compiled routes (verified to exist in app/)
  'inquiry', 'wioa-eligibility', 'career-services', 'career-training', 'community-services',
  'testimonials', 'verify',
  'accreditation', 'alumni', 'apprenticeships', 'cert', 'cna-waitlist', 'cookies',
  'disclosures', 'employers', 'events', 'faq', 'forms', 'governance', 'legal',
  'ojt-and-funding', 'pathways', 'privacy-policy', 'refund-policy', 'start',
  'support', 'terms-of-service', 'verify-credentials',
  'agencies', 'apprenticeship-sponsor', 'booking',
  'employment-support', 'federal-compliance', 'instructor-credentials',
  'partner-with-us', 'partnerships', 'snap-et-partner',
  'success-stories', 'tuition-fees', 'workone-partner-packet',
  // Shared data modules imported by public pages — must never be quarantined
  'data',
  'components', 'actions',
]);

// Sub-paths inside allowed top-level dirs that must still be quarantined.
// These are Railway-only pages that live under otherwise-public top-level dirs.
const FORBIDDEN_SUBPATHS = new Set([
  // ferpa/* — entire dir is Railway-only (FERPA records management)
  'ferpa',
  // employer-portal sub-pages are Railway app
  'employer-portal',
  // employers/* sub-pages that are Railway-only
  'employers/apprenticeships',
  'employers/benefits',
  'employers/post-job',
  'employers/talent-pipeline',
  // instructor-credentials is Railway-only
  'instructor-credentials',
  // legal sub-pages that are Railway-only
  'legal/employer-agreement',
  'legal/governance/lms-standards',
  'legal/governance/onboarding-ux',
  'legal/student-handbook',
  'legal/acceptable-use',
  'legal/ferpa-consent',
  'legal/marketplace-terms',
  'legal/mou',
  'legal/partner-mou',
  // platform sub-pages that are Railway-only
  'platform/program-holders',
  // policies — only keep the public-facing index; quarantine all sub-pages
  // (policies are internal governance docs, not public marketing)
  'policies/academic-integrity',
  'policies/acceptable-use',
  'policies/admissions',
  'policies/ai-usage',
  'policies/attendance',
  'policies/community-guidelines',
  'policies/content',
  'policies/copyright',
  'policies/data-retention',
  'policies/disaster-recovery',
  'policies/disaster-recovery-test',
  'policies/dr-test-report',
  'policies/editorial',
  'policies/federal-compliance',
  'policies/ferpa',
  'policies/funding-verification',
  'policies/grant-application',
  'policies/grievance',
  'policies/incident-response',
  'policies/jri',
  'policies/moderation',
  'policies/privacy-notice',
  'policies/progress',
  'policies/response-sla',
  'policies/revocation',
  'policies/sam-gov-eligibility',
  'policies/sla',
  'policies/student-code',
  'policies/terms',
  'policies/verification',
  'policies/wioa',
  'policies/wrg',
  // partners onboarding flows — Railway-only (require auth)
  'partners/barbershop-apprenticeship/onboarding',
  'partners/barbershop-apprenticeship/(onboarding)',
  'partners/cosmetology-apprenticeship/onboarding',
  'partners/cosmetology-apprenticeship/(onboarding)',
  'partners/create-program',
  'partners/jri',
  'partners/mou',
  // resources sub-pages that are Railway-only
  'resources/instructor-training',
  // funding sub-pages that are Railway-only
  'funding/wrg',
]);

// Root-level files that must stay (Next.js requires them, or layout.tsx imports them)
const ALLOWED_ROOT_FILES = new Set([
  'page.tsx', 'page.ts', 'layout.tsx', 'layout.ts', 'globals.css',
  'not-found.tsx', 'not-found.ts', 'error.tsx', 'error.ts',
  'loading.tsx', 'loading.ts', 'template.tsx', 'template.ts',
  'robots.ts', 'sitemap.ts', 'favicon.ico',
  'RootWidgets.tsx', 'HomeClientShell.tsx', 'HomeHeroVideo.tsx',
]);

// Forbidden nested segments — quarantine even inside allowed top-level dirs
const FORBIDDEN_SEGMENTS = new Set([
  'admin', 'api', 'lms', 'learner', 'student', 'dashboard', 'my-dashboard',
  'instructor', 'employer', 'partner-dashboard', 'program-holder', 'staff-portal',
  'case-manager', 'proctor', 'creator', 'builder', 'generate', 'reports',
  'approvals', 'account', 'profile', 'settings', 'billing', 'checkout', 'pay',
  'payment', 'enroll', 'enrollment', 'messages', 'notifications', 'certificates',
  'credentials', 'transcript', 'advising', 'documents', 'compliance', 'apprentice',
  'schedule', 'videos', 'video', 'ai', 'ai-chat', 'ai-studio', 'ai-tutor',
  'supersonic', 'tax', 'pwa',
  // Auth/app flows — belong to Railway runtime, not Netlify static build
  'reset-password', 'forgot-password', 'confirm', 'enrollment-success', 'enrollment', 'orientation', 'training',
]);

async function moveEntry(src, dest) {
  await mkdir(dirname(dest), { recursive: true });
  try {
    await rename(src, dest);
  } catch (e) {
    if (e.code === 'EXDEV') {
      await cp(src, dest, { recursive: true });
      await rm(src, { recursive: true, force: true });
    } else throw e;
  }
}

async function countRoutes(dir) {
  let count = 0;
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    if (e.isDirectory()) count += await countRoutes(join(dir, e.name));
    else if (['page.tsx','page.ts','route.ts','route.tsx'].includes(e.name)) count++;
  }
  return count;
}

async function collectForbiddenNested(dir, quarantineBase, toMove) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const src = join(dir, entry.name);
    const dest = join(quarantineBase, entry.name);
    if (FORBIDDEN_SEGMENTS.has(entry.name)) {
      const rel = src.replace(APP_DIR + '/', '');
      toMove.push({ src, dest, label: rel });
    } else {
      await collectForbiddenNested(src, dest, toMove);
    }
  }
}

async function quarantine() {
  const before = await countRoutes(APP_DIR);
  const entries = await readdir(APP_DIR, { withFileTypes: true });
  const toMove = [];

  for (const entry of entries) {
    const name = entry.name;
    const src  = join(APP_DIR, name);
    const dest = join(QUARANTINE_DIR, name);

    if (!entry.isDirectory()) {
      if (!ALLOWED_ROOT_FILES.has(name)) toMove.push({ src, dest, label: name });
      continue;
    }

    // Route groups (auth), (marketing), etc. and _private dirs — quarantine all
    if (name.startsWith('(') || name.startsWith('_')) {
      toMove.push({ src, dest, label: name });
      continue;
    }

    // Not in allowlist → quarantine
    if (!ALLOWED_TOP_LEVEL.has(name)) {
      toMove.push({ src, dest, label: name });
      continue;
    }

    // In allowlist — check forbidden sub-paths first, then scan nested segments
    const relName = name;
    let subpathQuarantined = false;
    for (const forbidden of FORBIDDEN_SUBPATHS) {
      if (forbidden === relName || forbidden.startsWith(relName + '/')) {
        // The entire top-level dir or a specific sub-path is forbidden
        const subRel = forbidden.slice(relName.length).replace(/^\//, '');
        if (!subRel) {
          // Entire dir is forbidden
          toMove.push({ src, dest, label: name });
          subpathQuarantined = true;
          break;
        } else {
          // Specific sub-path inside this allowed dir
          const subSrc  = join(src, subRel);
          const subDest = join(dest, subRel);
          if (existsSync(subSrc)) {
            toMove.push({ src: subSrc, dest: subDest, label: `${name}/${subRel}` });
          }
        }
      }
    }
    if (!subpathQuarantined) {
      await collectForbiddenNested(src, dest, toMove);
    }
  }

  console.log(`[quarantine] Before: ${before} routes in app/`);
  console.log(`[quarantine] Quarantining ${toMove.length} entries...`);
  for (const { src, dest, label } of toMove) {
    await moveEntry(src, dest);
    console.log(`  ✓ ${label}`);
  }
  const after = await countRoutes(APP_DIR);
  console.log(`[quarantine] After: ${after} routes in app/ (removed ${before - after})`);
}

async function restoreRecursive(srcDir, destDir) {
  let entries;
  try { entries = await readdir(srcDir, { withFileTypes: true }); } catch { return 0; }
  let n = 0;
  for (const entry of entries) {
    const src  = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (entry.isDirectory() && existsSync(dest)) {
      // Destination directory already exists — merge recursively
      n += await restoreRecursive(src, dest);
      await rm(src, { recursive: true, force: true });
    } else {
      await moveEntry(src, dest);
      n++;
    }
  }
  return n;
}

async function restore() {
  if (!existsSync(QUARANTINE_DIR)) { console.log('[quarantine] Nothing to restore.'); return; }
  const entries = await readdir(QUARANTINE_DIR, { withFileTypes: true });
  console.log(`[quarantine] Restoring ${entries.length} top-level entries...`);
  const n = await restoreRecursive(QUARANTINE_DIR, APP_DIR);
  console.log(`[quarantine] Restored ${n} entries.`);
}

if (RESTORE) { await restore(); } else { await quarantine(); }
