import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

// Force static generation at build time.
// The Netlify lambda filesystem is read-only at runtime, so fs.readdirSync
// would return nothing and produce an empty sitemap. Generating statically
// at build time captures the full page list and serves it from CDN.
export const dynamic = 'force-static';

const ELEVATE_URL = 'https://www.elevateforhumanity.org';

// Routes that should NOT be in sitemap (auth-gated, private, or separate-domain routes)
const EXCLUDED_PREFIXES = [
  '/admin',
  '/lms',
  '/student',
  '/staff',
  '/staff-portal',
  '/student-portal',
  '/partner-portal',
  '/api',
  '/auth',
  '/login',
  '/signup',
  '/sign',
  '/register',
  '/reset',
  '/reset-password',
  '/verify-email',
  '/verify-identity',
  '/partners/admin',
  '/partners/dashboard',
  '/partners/attendance',
  '/partners/documents',
  '/partners/login',
  '/partners/reports',
  '/partners/students',
  '/partners/support',
  '/org',
  '/docs/ENV',
  '/checkout',
  '/payment',
  '/pay',
  '/invoice',
  '/billing',
  '/test',
  '/dev',
  '/debug',
  '/settings',
  '/account',
  '/dashboard',
  '/portals',
  '/approvals',
  '/mentor',
  '/reports',
  '/analytics',
  '/performance-report',
  '/cache-diagnostic',
  '/sentry-test',
  '/test-enrollment',
  '/test-images',
  '/unauthorized',
  '/access-paused',
  '/builder',
  '/onboarding',
  '/programs/admin',
  '/creator',
  '/instructor',
  '/learner',
  '/employer/dashboard',
  '/employer/settings',
  '/employer/shop',
  '/employer-portal',
  '/program-holder/dashboard',
  '/program-holder/settings',
  '/program-holder/onboarding',
  '/program-holder/verify-identity',
  '/partner/login',
  '/partner/settings',
  '/partner-portal',
  '/partner/onboarding',

  '/shop/checkout',
  '/shop/onboarding',

  '/workforce-board',
  '/help/admin',
  '/supersonic',
  // Redirect-only routes — canonical URLs are elsewhere
  '/programs/cna',
  '/programs/cdl/waitlist',

  // Portal/role-specific routes — auth-gated, not public content
  '/apprentice',
  '/partner', // /partner/* (role portal) — /partners/* (public partner pages) is allowed
  '/program-holder',
  '/compliance',
  '/ferpa',
  '/leaderboard',
  '/messages',
  '/notifications',
  '/profile',
  '/transcript',
  '/update-password',
  '/verification-approvals',
  '/suboffice-onboarding',
  '/file-manager',
  '/import',
  '/generate',
  '/proctor',
  '/connect',
  '/connects',

  // Internal docs — not public-facing
  '/docs/admins',
  '/docs/api',
  '/docs/lms',
  '/docs/ENV',

  // Employer portal sub-routes (employer landing page /employer is public)
  '/employer/analytics',
  '/employer/apprenticeships',
  '/employer/candidates',
  '/employer/compliance',
  '/employer/documents',
  '/employer/hours',
  '/employer/jobs',
  '/employer/opportunities',
  '/employer/placements',
  '/employer/post-job',
  '/employer/reports',
  '/employer/verification',

  // Internal-only policy/test pages
  '/policies/disaster-recovery-test',
  '/policies/dr-test-report',

  // Shop internal pages
  '/shop/reports',
  '/shop/seller',
  '/shop/products/new',

  // Enrollment flow pages
  '/enrollment',
  '/enrollment-agreement',

  // Auth / invite flows
  '/accept-invite',
  '/install-app',
  '/my-dashboard',

  // AI tools (auth-gated)
  '/ai',

  // Apply sub-routes (noindex)
  '/apply/barber-apprenticeship',
  '/apply/confirmation',

  // Case manager portal
  '/case-manager',

  // Client portal demo
  '/client-portal',

  // Contracts (auth-gated legal docs)
  '/contracts',

  // Course preview (internal)
  '/course-preview',

  // Demo surfaces
  '/demo',
  '/demos',

  // Documents portal
  '/documents',

  // Donate thank-you (post-action)
  '/donate/thank-you',

  // Old audience redirect stubs
  '/for-partners',
  '/partner-with-us',
  '/platform/training-providers',

  // FSSA portal
  '/fssa',

  // Funding confirm (post-action)
  '/funding/confirm',

  // Groups (auth-gated)
  '/groups',

  // Industries redirect stubs
  '/industries',

  // Legal docs (noindex)
  '/legal/data-sharing',
  '/legal/employer-agreement',
  '/legal/enrollment-agreement',
  '/legal/ferpa-consent',
  '/legal/participation-agreement',
  '/legal/partner-mou',
  '/legal/program-host-agreement',
  '/legal/program-license-agreement',
  '/legal/student-handbook',

  // Partner portal sub-routes
  '/partner/attendance',
  '/partner/programs',
  '/partner/students',

  // Partner thank-you pages (post-action)
  '/partners/barbershop-apprenticeship/thank-you',
  '/partners/cosmetology-apprenticeship/thank-you',

  // Program orientation (auth-gated)
  '/programs/barber-apprenticeship/orientation',

  // Old program slug stubs (redirect stubs, noindex)
  '/programs/cdl',
  '/programs/cpr-first-aid-hsi',
  '/programs/cybersecurity',
  '/programs/hvac',
  '/programs/it-support',
  '/programs/professional-esthetician',
  '/programs/tax-prep-financial-services',

  // Provider portal
  '/provider',

  // Schedule select (auth-gated)
  '/schedule/select',

  // Shop/store internal
  '/shop/cart',
  '/store/cart',
  '/store/demos',
  '/store/guides/capital-readiness/enterprise',
  '/store/licenses/managed',
  '/store/request-license',

  // Tax self-prep (auth-gated)
  '/tax-self-prep',

  // Accreditation (internal)
  '/accreditation',

  // Internal docs (noindex)
  '/docs',

  // Placeholder stub pages (noindex, not yet built)
  '/cm',
  '/create-course',
  '/mobile',
  '/video',

  // Sections where layout.tsx sets robots: noindex
  '/apps',
  '/career-services',
  '/certiport-exam',
  '/employer',
  '/next-steps',
  '/social',
  '/store',

  // Enrollment / transactional flow pages (not content)
  '/apply',
  '/booking',
  '/careers/assessment',
  '/enroll',
  '/forms',
  '/schedule/meeting',
  '/status',
  '/support',

  // Auth-gated or internal pages confirmed leaking through filter
  '/mou/employer',        // MOU signing form — requires admin client
  '/parent-portal',       // Auth-gated — redirects to login
  '/usermanagement',      // Stub page — no real content
  '/certificates/verify', // Stub page — generic placeholder
  '/legal/governance',    // Internal governance docs — not public policy
];

// Segments that indicate private routes regardless of position
const EXCLUDED_SEGMENTS = [
  '/dashboard',
  '/settings',
  '/checkout',
  '/onboarding',
  '/login',
  '/signup',
  '/admin',
];

// Route suffixes that indicate enrollment flows, success pages, or internal actions
const EXCLUDED_SUFFIXES = [
  '/apply',
  '/apply/success',
  '/enroll',
  '/enrollment-success',
  '/enrollment/confirmed',
  '/documents',
  '/documents/upload',
  '/orientation',
  '/curriculum',
  '/course',
  '/host-shops',
  '/timeclock',
  '/transfer-hours',
  '/transfer-hours/request',
  '/hours/log',
  '/hours/history',
  '/hours',
  '/skills',
  '/state-board',
  '/handbook',
  '/sign-mou',
  '/mou',
  '/success',
  '/confirmed',
  '/upload',
  '/my-courses',
  '/competency-test',
  '/analytics',
  '/candidates',
  '/compliance',
  '/placements',
  '/verification',
  '/opportunities',
  '/apprenticeships/new',
  '/products/new',
  '/reports/new',
  '/seller/register',
  '/confirm',
  '/payment-setup',
];

// Canonical SEO authority hub prefixes — buyer-intent local/Indiana search
const SEO_HUB_PREFIXES = [
  '/workforce-training-indianapolis',
  '/wioa-funded-training-indiana',
  '/healthcare-training-indianapolis',
  '/skilled-trades-training-indiana',
  '/it-certification-training-indianapolis',
  '/employer-workforce-partnerships-indiana',
  '/agency-referral-workforce-training-indiana',
] as const;

// Priority mapping based on route patterns
function getPriority(route: string): number {
  if (route === '/') return 1.0;
  if (route === '/apply' || route === '/programs') return 1.0;
  // SEO authority hubs — buyer-intent local/Indiana search (priority 1.0)
  if (SEO_HUB_PREFIXES.some(p => route.startsWith(p))) return 1.0;
  if (route.startsWith('/programs/')) return 0.9;
  if (route.startsWith('/apprenticeships')) return 0.9;
  if (route === '/employers' || route === '/how-it-works') return 0.9;
  if (route.startsWith('/about') || route === '/contact') return 0.8;
  if (route.startsWith('/funding') || route.startsWith('/career')) return 0.8;
  // State-specific SEO pages - high priority
  if (route.startsWith('/career-training-')) return 0.9;
  if (route.startsWith('/community-services-')) return 0.9;
  if (route.startsWith('/courses')) return 0.8;
  if (route.startsWith('/store/guides')) return 0.8;
  if (route.startsWith('/blog') || route.startsWith('/resources')) return 0.7;
  if (route.startsWith('/policies') || route.startsWith('/privacy') || route.startsWith('/terms'))
    return 0.4;
  return 0.6;
}

// Change frequency based on route patterns
function getChangeFreq(
  route: string,
): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (route === '/' || route === '/apply') return 'daily';
  if (route.startsWith('/programs') || route.startsWith('/blog')) return 'weekly';
  // SEO authority hubs — reviewed and updated monthly
  if (SEO_HUB_PREFIXES.some(p => route.startsWith(p))) return 'monthly';
  // State-specific pages update monthly
  if (route.startsWith('/career-training-') || route.startsWith('/community-services-'))
    return 'monthly';
  if (route.startsWith('/policies') || route.startsWith('/privacy')) return 'yearly';
  return 'monthly';
}

// Recursively find all page.tsx files.
// Only runs at build time (dynamic = 'force-static'). The Netlify lambda
// filesystem is read-only at runtime and does not contain the app/ source tree,
// so this function would return nothing if called at request time.
function findAllPages(dir: string, basePath: string = ''): string[] {
  const routes: string[] = [];

  if (!fs.existsSync(dir)) return routes;

  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Skip dynamic routes [param], private dirs (__), and hidden dirs
        if (item.name.startsWith('[') || item.name.startsWith('_') || item.name.startsWith('.'))
          continue;

        // Route groups (name) — strip parens, don't add to path
        let routePart = item.name;
        if (item.name.startsWith('(') && item.name.endsWith(')')) {
          routePart = '';
        }

        const newBasePath = routePart ? `${basePath}/${routePart}` : basePath;
        routes.push(...findAllPages(fullPath, newBasePath));
      } else if (item.name === 'page.tsx' || item.name === 'page.ts') {
        routes.push(basePath || '/');
      }
    }
  } catch {
    // Unreadable directory — skip silently
  }

  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Find all pages in the app directory
  const appDir = path.join(process.cwd(), 'app');
  const allRoutes = findAllPages(appDir);

  // Filter out excluded routes and deduplicate
  const publicRoutes = [...new Set(allRoutes)]
    .filter((route) => {
      // Check prefix exclusions
      if (EXCLUDED_PREFIXES.some((prefix) => route.startsWith(prefix))) return false;
      // Check segment exclusions (e.g. /programs/admin, /store/checkout)
      const segments = route.split('/');
      if (segments.some((seg) => EXCLUDED_SEGMENTS.includes(`/${seg}`))) return false;
      // Check suffix exclusions — enrollment flows and internal sub-pages
      if (EXCLUDED_SUFFIXES.some((suffix) => route.endsWith(suffix))) return false;
      return true;
    })
    .sort();

  // Generate sitemap entries — all routes belong to elevateforhumanity.org
  const entries: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: `${ELEVATE_URL}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: getChangeFreq(route),
    priority: getPriority(route),
  }));

  return entries;
}
