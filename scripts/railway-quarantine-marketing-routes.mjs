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

// Accept RAILWAY (legacy) or BUILD_SCOPE (AWS) to activate quarantine
if (!process.env.RAILWAY && !process.env.BUILD_SCOPE && !RESTORE) {
  console.log('[quarantine] BUILD_SCOPE not set — skipping.');
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

// LMS service: ALL public-facing + learner routes.
// www.elevateforhumanity.org routes to this ECS service — every page a
// visitor or learner can reach must be in this list.
const LMS_ONLY = [
  // ── LMS / learner core ─────────────────────────────────────────────────────
  'lms', 'learner', 'courses', 'course-preview', 'my-dashboard', 'dashboard',
  'onboarding', 'orientation', 'student', 'student-portal', 'account',
  'profile', 'settings', 'billing', 'checkout', 'pay', 'payment', 'enroll',
  'enrollment', 'messages', 'notifications', 'search', 'certificates',
  'credentials', 'achievements', 'transcript', 'advising', 'next-steps',
  'sign', 'documents', 'compliance', 'apprentice', 'schedule', 'portals',
  'videos', 'video', 'ai', 'ai-chat', 'ai-studio', 'ai-tutor',
  'certification', 'certifications', 'cert', 'leaderboard', 'alumni',
  'forums', 'groups', 'social', 'community-services', 'learning',
  'workbooks', 'tutoring', 'writing-center', 'career-assessment',
  'career-counseling', 'career-services', 'career-training',
  'wioa-participant', 'wioa-eligibility', 'check-eligibility', 'eligibility',
  'next-steps', 'pathways', 'micro-classes', 'microclasses',
  // ── Programs / apply / enrollment ──────────────────────────────────────────
  'programs', 'apply', 'enroll', 'enrollment', 'apprenticeships',
  'store', 'shop', 'checkout', 'cart', 'payment', 'pay', 'billing',
  'financing', 'tuition', 'tuition-fees', 'pricing', 'scholarships',
  'financial-aid', 'grants', 'funding', 'funding-impact', 'fundingimpact',
  'wioa-funded-training-indiana', 'ojt-and-funding', 'fssa', 'fssa-impact',
  'fssa-partnership-request', 'snap-et-partner', 'jri',
  // ── Partner / employer / instructor portals ────────────────────────────────
  'employer', 'employer-portal', 'employers', 'hire-graduates',
  'employer-workforce-partnerships-indiana', 'for-employers',
  'instructor', 'program-holder', 'partner', 'partner-portal',
  'partner-with-us', 'partnerships', 'partner-learning',
  'partner-operating-model', 'partner-upload', 'for-partners',
  'training-providers', 'workforce-partners', 'workforce-board',
  'schools', 'provider', 'agencies', 'for-agencies',
  'apprenticeship-sponsor', 'workone-partner-packet',
  // ── Public marketing ───────────────────────────────────────────────────────
  'about', 'accreditation', 'accessibility', 'blog', 'careers', 'contact',
  'faq', 'home', 'team', 'verify', 'workforce', 'sitemap', 'site-map',
  'news', 'events', 'press', 'testimonials', 'success-stories', 'impact',
  'outcomes', 'metrics', 'transparency', 'philanthropy', 'donate', 'donations',
  'volunteer', 'rise', 'what-we-do', 'what-we-offer', 'how-it-works',
  'getstarted', 'start', 'for-students', 'students',
  // ── SEO landing pages ──────────────────────────────────────────────────────
  'career-training-indiana', 'career-training-illinois', 'career-training-ohio',
  'career-training-tennessee', 'career-training-texas',
  'community-services-indiana', 'community-services-illinois',
  'community-services-ohio', 'community-services-tennessee',
  'community-services-texas', 'healthcare-training-indianapolis',
  'it-certification-training-indianapolis', 'skilled-trades-training-indiana',
  'workforce-training-indianapolis', 'wioa-funded-training-indiana',
  'agency-referral-workforce-training-indiana',
  // ── Legal / policy / compliance ────────────────────────────────────────────
  'policies', 'legal', 'privacy', 'privacy-policy', 'terms', 'terms-of-service',
  'ferpa', 'dmca', 'eula', 'cookies', 'copyright', 'disclosures',
  'refund-policy', 'license-agreement', 'acceptable-use-policy',
  'consumer-education', 'equal-opportunity', 'federal-compliance',
  'governance', 'institutional-governance', 'instructional-framework',
  'academic-integrity', 'academic-calendar', 'attendance-policy',
  'satisfactory-academic-progress', 'grievance', 'security',
  'security-and-data-protection', 'enrollment-agreement',
  'student-handbook', 'syllabi', 'workkeys', 'certiport-exam',
  // ── Misc public pages ──────────────────────────────────────────────────────
  'connect', 'connects', 'c', 'verify-credential', 'verify-credentials',
  'verify-identity', 'verification-approvals', 'application-success',
  'thankyou', 'success', 'payment-error', 'access-paused',
  'license-suspended', 'offline', 'error', 'status',
  'install-app', 'mobile', 'mobile-app', 'pwa',
  'webinars', 'reels', 'ebook', 'downloads', 'resources', 'docs',
  'directory', 'locations', 'calendar', 'booking', 'schedule-consultation',
  'call-now', 'card', 'share', 'email', 'chat', 'ai-chat-standalone',
  'intake', 'register', 'cna-waitlist', 'inquiry',
  'mou', 'contracts', 'forms', 'sheets', 'import',
  'help', 'support', 'student-support', 'updates',
  'apps', 'creator', 'generate', 'create-course', 'curriculumupload',
  'builder', 'file-manager', 'usermanagement', 'analytics',
  'demos', 'demo', 'dev', 'testing',
  'hvac', 'barber-apprenticeship', 'booth-rental',
  'kingdom-konnect', 'serene-comfort-care', 'urban-build-crew',
  'elevatelearn2earn', 'ecosystem', 'network', 'platform', 'solutions',
  'education', 'educatorhub', 'government', 'white-label',
  'for', 'industries', 'services', 'banking',
  'tax-self-prep', 'licensing', 'licenses', 'license',
  'certification-testing', 'instructor-credentials',
  'suboffice-onboarding', 'parent-portal', 'client-portal',
  'cm', 'mentor', 'case-manager', 'proctor', 'approvals', 'reports',
  'staff-portal', 'workforce-board',
  'BingSiteAuth.xml', 'feed.xml', 'google-site-verification.txt',
  'partners', 'training', 'calculator', 'dashboards',
  'employment-support', 'founder', 'update-password',
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
