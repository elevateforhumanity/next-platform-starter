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

const RESTORE = process.argv.includes('--restore');
const FORCE = process.argv.includes('--force');
const IS_NETLIFY = process.env.NETLIFY === 'true' || FORCE;

if (!IS_NETLIFY && !RESTORE) {
  console.log('[quarantine] Not on Netlify — skipping. Use --force to run locally.');
  process.exit(0);
}

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'app');
const QUARANTINE_DIR = join(ROOT, '.netlify-quarantine', 'app');

// ALLOWLIST: top-level app/ directories Netlify may compile.
// Everything else is quarantined automatically.
// 'components' and 'actions' are shared infrastructure imported by layout.tsx —
// they contain no page.tsx/route.ts so Next.js does not treat them as routes.
const ALLOWED_TOP_LEVEL = new Set([
  // ── Webmaster verification + feeds (must be served by Netlify/CDN) ────────
  'BingSiteAuth.xml',
  'feed.xml',
  'google-site-verification.txt',
  'layouts',
  // ── Core public marketing ─────────────────────────────────────────────────
  'about',
  'install-app',
  'contact',
  'programs',
  'apply',
  'check-eligibility',
  'eligibility',
  'privacy',
  'terms',
  'accessibility',
  'resources',
  'funding',
  'partners',
  'locations',
  'testing',
  'accreditation',
  'snap-et-partner',
  'agencies',
  'employers',
  'apprenticeships',
  'apprenticeship-sponsor',
  'platform',
  'policies',
  'legal',
  'governance',
  // ── Auth entry points — static shells only ────────────────────────────────
  'login',
  'signup',
  // ── Public program/content pages ─────────────────────────────────────────
  'blog',
  'news',
  'search',
  'verify',
  'verify-credentials',
  'training',
  'career-services',
  'career-training',
  'community-services',
  'pathways',
  'wioa-eligibility',
  'ojt-and-funding',
  'certiport-exam',
  'cert',
  'career-assessment',
  // ── Public info/utility pages ─────────────────────────────────────────────
  'faq',
  'events',
  'testimonials',
  'success-stories',
  'alumni',
  'achievements',
  'calendar',
  'booking',
  'forms',
  'inquiry',
  'start',
  'cna-waitlist',
  'employment-support',
  'partner-with-us',
  'partnerships',
  'federal-compliance',
  'equal-opportunity',
  'disclosures',
  'cookies',
  'privacy-policy',
  'terms-of-service',
  'refund-policy',
  'dmca',
  'ebook',
  'enrollment-agreement',
  'next-steps',
  'security',
  'support',
  'tuition-fees',
  'workone-partner-packet',
  // ── Public pages currently quarantined — should be live ───────────────────
  'donate',
  'careers',
  'for-agencies',
  'for-employers',
  'for-partners',
  'for-students',
  'outcomes',
  'site-map',
  'security-and-data-protection',
  'funding-impact',
  'fssa',
  'government',
  'hire-graduates',
  'how-it-works',
  'industries',
  'jri',
  // ── Public MOU signing ────────────────────────────────────────────────────
  'mou',
  // ── Portal landing pages — sub-pages quarantined via FORBIDDEN_SUBPATHS ──
  'student-portal',
  'partner-portal',
  'workforce-board',
  'instructor',
  'lms',
  // Shared data modules imported by public pages — must never be quarantined
  'data',
  'components',
  'actions',
  // ── Academic / policy pages ───────────────────────────────────────────────
  'academic-calendar',
  'academic-integrity',
  'acceptable-use-policy',
  'access-paused',
  'attendance-policy',
  'satisfactory-academic-progress',
  'student-handbook',
  'syllabi',
  'instructional-framework',
  'institutional-governance',
  // ── Auth utility pages (public shells) ───────────────────────────────────
  'admin-login',
  'billing-required',
  'error',
  'forgot-password',
  'register',
  'reset',
  'reset-password',
  'unauthorized',
  'update-password',
  'verify-credential',
  'verify-email',
  // ── Program / training pages ──────────────────────────────────────────────
  'barber-apprenticeship',
  'booth-rental',
  'career-counseling',
  'career-training-illinois',
  'career-training-indiana',
  'career-training-ohio',
  'career-training-tennessee',
  'career-training-texas',
  'certification-testing',
  'certifications',
  'community-services-illinois',
  'community-services-indiana',
  'community-services-ohio',
  'community-services-tennessee',
  'community-services-texas',
  'course-preview',
  'courses',
  'healthcare-training-indianapolis',
  'hvac',
  'it-certification-training-indianapolis',
  'micro-classes',
  'microclasses',
  'skilled-trades-training-indiana',
  'wioa-funded-training-indiana',
  'workforce-training-indianapolis',
  'workkeys',
  'agency-referral-workforce-training-indiana',
  'employer-workforce-partnerships-indiana',
  // ── Marketing / info pages ────────────────────────────────────────────────
  'ai-chat-standalone',
  'application-success',
  'banking',
  'c',
  'calculator',
  'call-now',
  'chat',
  'connect',
  'connects',
  'consumer-education',
  'contracts',
  'copyright',
  'create-course',

  'dev',
  'directory',
  'docs',
  // docs/Indiana-Barbershop-Apprenticeship-MOU shows inline signup prompt only — no hard redirect
  'donations',
  'downloads',
  'ecosystem',
  'education',
  'educatorhub',

  'email',
  'eula',
  'financing',
  'for',
  'forums',
  'founder',
  'fssa-impact',
  'fssa-partnership-request',
  'fundingimpact',
  'getstarted',
  'grants',
  'grievance',
  'help',
  'import',
  'intake',
  'kingdom-konnect',
  'leaderboard',
  'learning',
  'license-agreement',
  'license-suspended',
  'licenses',
  'licensing',
  'licensing-partnerships',
  'metrics',
  'mobile',
  'mobile-app',
  'network',
  'offline',
  'partner-upload',
  'payment-error',
  'philanthropy',
  'press',
  'pricing',
  'reels',
  'rise',
  'schedule-consultation',
  'scholarships',
  'schools',
  'serene-comfort-care',
  'services',
  'share',

  'social',
  'solutions',
  'status',
  'students',
  'suboffice-onboarding',
  'success',
  'team',
  'thankyou',
  'training-providers',
  'transparency',
  'tuition',
  'tutoring',
  'updates',
  'urban-build-crew',

  'verification-approvals',
  'volunteer',
  'webinars',
  'what-we-do',
  'what-we-offer',
  'white-label',
  'workbooks',
  'workforce-partners',
  'writing-center',
  // ── Mixed pages — landing public, sub-pages Railway ───────────────────────
  // (sub-pages listed in FORBIDDEN_SUBPATHS below)
  'shop',
  'student-support',
  'tax-self-prep',
  'client-portal',
  // ── Store / demo / portal — public landing pages ──────────────────────────
  'store',
  'demo',
  'demos',
  'portals',
  // ── New public pages ──────────────────────────────────────────────────────
  'partner-operating-model',
  'wioa-participant',
  'certification',
]);

// Sub-paths inside allowed top-level dirs that must still be quarantined.
// These are Railway-only pages that live under otherwise-public top-level dirs.
const FORBIDDEN_SUBPATHS = new Set([
  // ferpa/* — entire dir is Railway-only (FERPA records management)
  'ferpa',
  // employer-portal/* sub-pages — top-level employer-portal is in ALLOWED (public landing)
  // sub-pages are Railway-only (auth-gated). Matches app/employer-portal/* dirs.
  'employer-portal/analytics',
  'employer-portal/applications',
  'employer-portal/candidates',
  'employer-portal/company',
  'employer-portal/interviews',
  'employer-portal/jobs',
  'employer-portal/messages',
  'employer-portal/programs',
  'employer-portal/settings',
  'employer-portal/wotc',
  // student-portal sub-pages are Railway app (landing page itself is public)
  'student-portal/announcements',
  'student-portal/assignments',
  'student-portal/courses',
  'student-portal/dashboard',
  'student-portal/grades',
  'student-portal/handbook',
  'student-portal/hours',
  'student-portal/messages',
  'student-portal/onboarding',
  'student-portal/profile',
  'student-portal/resources',
  'student-portal/schedule',
  'student-portal/settings',
  // partner-portal sub-pages are Railway app (landing page itself is public)
  // (currently only has landing page — no sub-pages to quarantine)
  // workforce-board sub-pages are Railway app (landing page itself is public)
  'workforce-board/dashboard',
  'workforce-board/eligibility',
  'workforce-board/employment',
  'workforce-board/follow-ups',
  'workforce-board/participants',
  'workforce-board/supportive-services',
  'workforce-board/training',
  // instructor sub-pages are Railway app (landing page itself is public)
  'instructor/courses',
  'instructor/campaigns',
  'instructor/announcements',
  'instructor/programs',
  'instructor/submissions',
  'instructor/gradebook',
  'instructor/documents',
  'instructor/attendance',
  'instructor/dashboard',
  'instructor/settings',
  'instructor/analytics',
  'instructor/students',
  // ── Fully Railway-only top-level dirs ─────────────────────────────────────
  // These dirs have no public landing page — entire dir is Railway-only.
  'accept-invite',
  'sign',
  'analytics',
  'apps',
  'auth',
  'card',
  'cm',
  'dashboards',
  'employer-portal',
  'file-manager',
  'groups',
  'license',
  'mentor',
  'onboarding',
  'parent-portal',
  'partner',
  'partner-learning',

  'provider',
  'shop/cart',
  'shop/onboarding',
  'sign',

  'student-handbook',
  'student-support/schedule',
  'tax-self-prep/start',
  // verify-email and verify-identity: verify-email is public (moved to ALLOWED_SUBPATHS)
  'verify-identity',
  // lms/(app) is the authenticated LMS shell — Railway-only.
  // lms/(public) contains the public program catalog and landing page — stays on Netlify.
  // Quarantine the entire (app) route group; keep (public).
  'lms/(app)',
  // employers/* sub-pages that are Railway-only
  'employers/apprenticeships',
  'employers/benefits',
  'employers/post-job',
  'employers/talent-pipeline',
  // instructor-credentials is Railway-only
  'instructor-credentials',
  // legal sub-pages that are Railway-only (authenticated flows)
  // NOTE: legal/mou, legal/partner-mou, legal/student-handbook etc. are public
  // static documents — they stay on Netlify (not listed here).
  'legal/employer-agreement',
  'legal/governance/lms-standards',
  'legal/governance/onboarding-ux',
  'legal/ferpa-consent',
  'legal/marketplace-terms',
  // platform sub-pages that are Railway-only
  'platform/program-holders',
  // policies/* — all public policy documents, served by Netlify SSR.
  // Do NOT quarantine — they are linked from public pages and use Supabase
  // only to fetch content (no auth required).
  // partners onboarding flows — Railway-only (require auth)
  // Move the entire (onboarding) route group; do NOT list sub-dirs separately
  // or the script will try to move them after the parent is already gone.
  'partners/barbershop-apprenticeship/(onboarding)',
  'partners/cosmetology-apprenticeship/(onboarding)',
  'partners/esthetician-apprenticeship',
  'partners/nail-technician-apprenticeship',
  'partners/create-program',
  'partners/jri',
  'partners/mou',
  // resources sub-pages that are Railway-only
  'resources/instructor-training',
  // funding/wrg is a public page (moved to ALLOWED_SUBPATHS)
]);

// Root-level files that must stay (Next.js requires them, or layout.tsx imports them)
const ALLOWED_ROOT_FILES = new Set([
  'page.tsx',
  'page.ts',
  'layout.tsx',
  'layout.ts',
  'globals.css',
  'not-found.tsx',
  'not-found.ts',
  'error.tsx',
  'error.ts',
  'loading.tsx',
  'loading.ts',
  'template.tsx',
  'template.ts',
  'robots.ts',
  'sitemap.ts',
  'favicon.ico',
  'RootWidgets.tsx',
  'HomeClientShell.tsx',
  'HomeHeroVideo.tsx',
]);

// Forbidden nested segments — quarantine even inside allowed top-level dirs
const FORBIDDEN_SEGMENTS = new Set([
  'admin',
  'api',
  'lms',
  'learner',
  'student',
  'dashboard',
  'my-dashboard',
  'instructor',
  'employer',
  'partner-dashboard',
  'program-holder',
  'staff-portal',
  'case-manager',
  'proctor',
  'creator',
  'builder',
  'generate',
  'reports',
  'approvals',
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
  'certificates',
  'credentials',
  'transcript',
  'advising',
  'documents',
  'compliance',
  'apprentice',
  'schedule',
  'videos',
  'video',
  'ai',
  'ai-chat',
  'ai-studio',
  'ai-tutor',
  'pwa',
  // Auth/app flows — belong to Railway runtime, not Netlify static build
  'confirm',
  'enrollment-success',
  'orientation',
]);

// Explicit sub-path overrides — these survive FORBIDDEN_SEGMENTS matching.
// Use this for public conversion pages whose segment name collides with a
// forbidden segment (e.g. apply/student, apply/employer).
const ALLOWED_SUBPATHS = new Set([
  // Public application funnels — linked from homepage, programs, footer
  'apply/student',
  'apply/employer',
  'apply/program-holder',
  // Public auth flows — linked from login page
  'forgot-password',
  'reset-password',
  'verify-email',
  // Server actions imported by public auth pages
  'auth/forgot-password',
  // Public funding info pages — linked from site footer
  'funding/wrg',
  // Public policy pages whose segment name collides with a forbidden segment
  'policies/credentials',
  'legal/governance/compliance',
  'legal/acceptable-use',
  'legal/student-handbook',
  'legal/mou',
  'legal/partner-mou',
]);

async function moveEntry(src, dest) {
  if (!existsSync(src)) {
    console.warn(`[quarantine] Skipping missing path: ${src.replace(ROOT + '/', '')}`);
    return;
  }
  await mkdir(dirname(dest), { recursive: true });
  try {
    await rename(src, dest);
  } catch (e) {
    // EXDEV: cross-device rename (different filesystems)
    // ENOTEMPTY: destination already exists from a previous quarantine run
    if (e.code === 'EXDEV' || e.code === 'ENOTEMPTY') {
      await cp(src, dest, { recursive: true });
      await rm(src, { recursive: true, force: true });
    } else throw e;
  }
}

async function countRoutes(dir) {
  let count = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    if (e.isDirectory()) count += await countRoutes(join(dir, e.name));
    else if (['page.tsx', 'page.ts', 'route.ts', 'route.tsx'].includes(e.name)) count++;
  }
  return count;
}

async function collectForbiddenNested(dir, quarantineBase, toMove) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const src = join(dir, entry.name);
    const dest = join(quarantineBase, entry.name);
    const rel = src.replace(APP_DIR + '/', '');
    // Never quarantine explicitly allowed sub-paths even if segment name is forbidden
    if (ALLOWED_SUBPATHS.has(rel)) {
      continue;
    }
    if (FORBIDDEN_SEGMENTS.has(entry.name)) {
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
    const src = join(APP_DIR, name);
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
          // Specific sub-path inside this allowed dir — skip if explicitly allowed
          const fullSubPath = `${relName}/${subRel}`;
          if (ALLOWED_SUBPATHS.has(fullSubPath)) continue;
          const subSrc = join(src, subRel);
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
  try {
    entries = await readdir(srcDir, { withFileTypes: true });
  } catch {
    return 0;
  }
  let n = 0;
  for (const entry of entries) {
    const src = join(srcDir, entry.name);
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
  if (!existsSync(QUARANTINE_DIR)) {
    console.log('[quarantine] Nothing to restore.');
    return;
  }
  const entries = await readdir(QUARANTINE_DIR, { withFileTypes: true });
  console.log(`[quarantine] Restoring ${entries.length} top-level entries...`);
  const n = await restoreRecursive(QUARANTINE_DIR, APP_DIR);
  console.log(`[quarantine] Restored ${n} entries.`);
}

if (RESTORE) {
  await restore();
} else {
  await quarantine();
}
