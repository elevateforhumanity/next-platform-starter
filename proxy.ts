import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Module-level constants ────────────────────────────────────────────────────

const EDUCATION_DOMAIN = 'elevateforhumanityeducation.com';
const CONNECTS_DOMAIN  = 'elevateconnects.org';
const LEARN_SUBDOMAIN  = 'learn.elevateforhumanity.org';
const PLATFORM_SUBDOMAIN = 'platform.elevateforhumanity.org';
const DEFAULT_ADMIN_URL = 'https://admin.elevateforhumanity.org';
const LEGACY_ADMIN_HOSTS = new Set(['app.elevateforhumanity.org']);

// Webhook paths bypass auth — Stripe signature verification handles security.
const WEBHOOK_PATHS = [
  '/api/webhooks/stripe',
  '/api/webhooks/',
  '/api/license/webhook',
  '/api/stripe/webhook',
  '/api/donations/webhook',
  '/api/barber/webhook',
  '/api/micro-classes/webhook',
  '/api/sezzle/webhook',
  '/api/payments',
  '/api/csp-report',
];

// Role-gated routes: key = path prefix, value = allowed roles.
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/partner-portal/':          ['partner', 'admin', 'super_admin'],
  '/partner/dashboard':        ['partner', 'admin', 'super_admin'],
  '/partner/documents':        ['partner', 'admin', 'super_admin'],
  '/partner/reports':          ['partner', 'admin', 'super_admin'],
  '/partner/settings':         ['partner', 'admin', 'super_admin'],
  '/partner/hours':            ['partner', 'admin', 'super_admin'],
  '/partner/attendance':       ['partner', 'admin', 'super_admin'],
  '/partner/courses/':         ['partner', 'admin', 'super_admin'],
  '/partner/programs/':        ['partner', 'admin', 'super_admin'],
  '/employer-portal/':         ['employer', 'admin', 'super_admin'],
  '/employer/dashboard':       ['employer', 'admin', 'super_admin'],
  '/employer/candidates':      ['employer', 'admin', 'super_admin'],
  '/employer/jobs':            ['employer', 'admin', 'super_admin'],
  '/employer/placements':      ['employer', 'admin', 'super_admin'],
  '/employer/hours':           ['employer', 'admin', 'super_admin'],
  '/employer/reports':         ['employer', 'admin', 'super_admin'],
  '/employer/settings':        ['employer', 'admin', 'super_admin'],
  '/employer/compliance':      ['employer', 'admin', 'super_admin'],
  '/employer/apprenticeships': ['employer', 'admin', 'super_admin'],
  '/employer/documents':       ['employer', 'admin', 'super_admin'],
  '/employer/analytics':       ['employer', 'admin', 'super_admin'],
  '/program-holder/dashboard': ['program_holder', 'admin', 'super_admin'],
  '/program-holder/programs':  ['program_holder', 'admin', 'super_admin'],
  '/program-holder/students':  ['program_holder', 'admin', 'super_admin'],
  '/program-holder/documents': ['program_holder', 'admin', 'super_admin'],
  '/program-holder/reports':   ['program_holder', 'admin', 'super_admin'],
  '/program-holder/settings':  ['program_holder', 'admin', 'super_admin'],
  '/program-holder/compliance':['program_holder', 'admin', 'super_admin'],
  '/program-holder/grades':    ['program_holder', 'admin', 'super_admin'],
  '/program-holder/mou':       ['program_holder', 'admin', 'super_admin'],
  '/program-holder/analytics': ['program_holder', 'admin', 'super_admin'],
  '/program-holder/onboarding':['program_holder', 'admin', 'super_admin'],
  '/program-holder/verification':['program_holder', 'admin', 'super_admin'],
  '/staff-portal/':            ['staff', 'admin', 'super_admin', 'advisor'],
  '/mentor/dashboard':         ['mentor', 'admin', 'super_admin'],
  '/mentor/sessions':          ['mentor', 'admin', 'super_admin'],
  '/mentor/mentees':           ['mentor', 'admin', 'super_admin'],
  '/mentor/settings':          ['mentor', 'admin', 'super_admin'],
};

// Routes requiring authentication (any role).
const AUTH_REQUIRED_ROUTES = [
  '/student-portal/',
  '/lms/dashboard',
  '/lms/courses/',
  '/lms/programs/',
  '/my-courses',
  '/my-progress',
  '/settings',
  '/profile',
  '/hub/',
  '/enrollment/',
];

// Routes requiring onboarding completion before access.
const ONBOARDING_REQUIRED_ROUTES = [
  '/hub/',
  '/lms/',
  '/student-portal/',
  '/my-courses',
  '/my-progress',
];

// Routes requiring an active enrollment.
const ENROLLMENT_REQUIRED_ROUTES = [
  '/lms/courses/',
  '/lms/programs/',
];

// Enrollment flow routes — exempt from the enrollment gate (they ARE the flow).
const ENROLLMENT_FLOW_ROUTES = [
  '/enrollment/',
  '/programs/',
  '/apply',
  '/check-eligibility',
];

// Partner routes requiring active partner status.
const PARTNER_ROUTES = [
  '/partner/dashboard',
  '/partner/programs/',
  '/partner/courses/',
];

// Partner routes allowed before active status (document upload, onboarding).
const PARTNER_ONBOARDING_ROUTES = [
  '/partner/documents',
  '/partner/onboarding',
  '/partner/apply',
];

// Dashboard landing pages that are PUBLIC (exact match — marketing/preview).
const PUBLIC_DASHBOARD_LANDINGS = [
  '/staff-portal',
  '/instructor',
  '/program-holder',
  '/workforce-board',
  '/employer-portal',
  '/employer',
  '/student-portal',
  '/partner-portal',
  '/mentor',
];

// Paths that get X-Robots-Tag: noindex, nofollow.
const NOINDEX_PREFIXES = [
  '/admin',
  '/staff-portal',
  '/instructor',
  '/program-holder',
  '/workforce-board',
  '/employer-portal',
  '/employer',
  '/student-portal',
  '/partner-portal',
  '/partner/',
  '/mentor/',
  '/hub/',
  '/enrollment/',
  '/onboarding',
  '/settings',
  '/profile',
];

// Admin emails that bypass the onboarding gate.
const ADMIN_EMAILS: string[] = [
  'elizabethpowell6262@gmail.com',
];

// ── Middleware entry point ────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const hostWithoutPort = host.split(':')[0];
  const { pathname, search } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  function nextWithPathname() {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const adminBase = (process.env.NEXT_PUBLIC_ADMIN_URL || DEFAULT_ADMIN_URL).replace(/\/+$/, '');
  let canonicalAdminHost = 'admin.elevateforhumanity.org';
  try {
    canonicalAdminHost = new URL(adminBase).host;
  } catch (error) {
    console.error('[proxy] Invalid NEXT_PUBLIC_ADMIN_URL. Falling back to default admin host.', error);
  }

  if (LEGACY_ADMIN_HOSTS.has(hostWithoutPort)) {
    return NextResponse.redirect(`${adminBase}${pathname}${search}`, { status: 301 });
  }

  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && hostWithoutPort !== canonicalAdminHost) {
    // Keep the canonical admin landing page explicit so host-only /admin requests
    // consistently land on the admin dashboard after domain canonicalization.
    const adminPath = pathname === '/admin' ? '/admin/dashboard' : pathname;
    return NextResponse.redirect(`${adminBase}${adminPath}${search}`, { status: 301 });
  }

  // ── BYPASS POLICY ────────────────────────────────────────────────────────────
  // Single definition. No other branch in this file references SKIP_ADMIN_AUTH.
  // allowDevAdminBypass is false in all production builds: NODE_ENV is set to
  // 'production' by Next.js at build time on Netlify, making this unreachable
  // regardless of any env var that may be set in the deployment environment.
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowDevAdminBypass = isDevelopment && process.env.SKIP_ADMIN_AUTH === 'true';

  // Gitpod preview domains — treat as development for routing purposes
  const isGitpodPreview = host.includes('.gitpod.dev') || host.includes('gitpod.io');

  // On Gitpod preview, redirect root to /admin/dashboard for convenience.
  // The admin namespace gate handles auth from there.
  if (isGitpodPreview && (pathname === '/' || pathname === '')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url), { status: 307 });
  }

  // Production misconfiguration guard — bypass remains disabled, but the
  // presence of SKIP_ADMIN_AUTH in a production environment is logged as an
  // error so a bad deployment is caught immediately in Netlify function logs.
  if (!isDevelopment && process.env.SKIP_ADMIN_AUTH) {
    console.error(
      '[SECURITY] SKIP_ADMIN_AUTH is set in a non-development environment. ' +
        'Bypass is disabled (NODE_ENV !== development), but this configuration is invalid and must be removed.',
    );
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // ============================================
  // WEBHOOK BYPASS (PATCH 4.1)
  // Stripe webhooks use signature verification, not auth
  // ============================================
  if (WEBHOOK_PATHS.some((path) => pathname.startsWith(path))) {
    return nextWithPathname();
  }

  // ============================================
  // CORS: Block cross-origin API requests from unknown origins
  // ============================================
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
      'https://elevateforhumanity.org',
      'https://www.elevateforhumanity.org',
      // Allow local dev requests (Postman, dev proxy, etc.)
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ];

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin':
            origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const isWebhook = pathname.includes('/webhook');
    if (!isWebhook && origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ============================================
    // API ROUTE AUTH ENFORCEMENT
    // Protect /api/admin/*, /api/staff/*, /api/instructor/* at proxy level
    // Individual routes still have their own checks as defense-in-depth
    // ============================================
    const PROTECTED_API_PREFIXES = [
      '/api/admin/',
      '/api/staff/',
      '/api/instructor/',
      // PII-sensitive routes — defense-in-depth alongside per-route guards
      '/api/identity/',
      '/api/documents/',
      '/api/verification/',
      '/api/tax/',
      '/api/franchise/',
      '/api/wotc/',
      '/api/apprentice/documents',
      '/api/onboarding/',
      '/api/compliance/',
      '/api/hr/',
      '/api/reports/',
    ];
    // Public API routes that must not be blocked by auth
    const PUBLIC_API_OVERRIDES = [
      '/api/intake',
      '/api/webhooks',
      '/api/stripe/webhook',
      '/api/ai-tutor/public',
      '/api/auth',
      '/api/cron',
    ];
    const isPublicApiOverride = PUBLIC_API_OVERRIDES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
    );
    const isProtectedApi =
      !isPublicApiOverride && PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isProtectedApi && !isWebhook) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      const apiSupabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            /* read-only for API auth check */
          },
        },
      });

      const {
        data: { user: apiUser },
      } = await apiSupabase.auth.getUser();
      if (!apiUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For admin API routes, verify admin/super_admin/staff role
      if (pathname.startsWith('/api/admin/')) {
        const { data: apiProfile } = await apiSupabase
          .from('profiles')
          .select('role')
          .eq('id', apiUser.id)
          .single();

        if (
          !apiProfile?.role ||
          !['admin', 'super_admin', 'org_admin', 'staff'].includes(apiProfile.role)
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      // For instructor API routes, verify instructor/admin role
      if (pathname.startsWith('/api/instructor/')) {
        const { data: apiProfile } = await apiSupabase
          .from('profiles')
          .select('role')
          .eq('id', apiUser.id)
          .single();

        if (
          !apiProfile?.role ||
          !['instructor', 'admin', 'super_admin'].includes(apiProfile.role)
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Non-protected API routes pass through
    if (pathname.startsWith('/api/') && !isProtectedApi) {
      return nextWithPathname();
    }
    // Protected API routes that passed auth check also pass through
    if (isProtectedApi) {
      return nextWithPathname();
    }
  }

  // ============================================
  // DOMAIN-BASED ROUTING
  // ============================================

  // Dead legacy path — /student-portal/education never existed, redirect to student portal
  if (
    pathname === '/student-portal/education' ||
    pathname.startsWith('/student-portal/education/')
  ) {
    return NextResponse.redirect(new URL('/student-portal', request.url), 301);
  }

  // All routes are served by the same AWS ECS container — no proxy needed.

  // learn.elevateforhumanity.org → /lms
  if (hostWithoutPort === LEARN_SUBDOMAIN) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/lms/dashboard', request.url));
    }
    // Pass sub-routes through (e.g. learn.elevateforhumanity.org/courses → /lms/courses)
    if (!pathname.startsWith('/lms')) {
      return NextResponse.rewrite(new URL(`/lms${pathname}`, request.url));
    }
    return nextWithPathname();
  }

  // Education domain routing (elevateforhumanityeducation.com)
  // Root -> /admin dashboard; all other routes pass through to the full site
  if (hostWithoutPort.includes(EDUCATION_DOMAIN)) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/admin', request.url));
    }
    return nextWithPathname();
  }

  // Connects domain routing (elevateconnects.org)
  // Root -> /connects landing page; all other routes pass through to the full site
  if (hostWithoutPort.includes(CONNECTS_DOMAIN)) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/connects', request.url));
    }
    return nextWithPathname();
  }

  // Platform subdomain routing (platform.elevateforhumanity.org -> /platform/licensing)
  if (hostWithoutPort === PLATFORM_SUBDOMAIN || hostWithoutPort === 'platform.elevateforhumanity.org') {
    // Skip for static files and API routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
      return nextWithPathname();
    }

    // Root of platform subdomain -> licensing page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/platform/licensing', request.url));
    }

    // Already on /platform path, allow through
    if (pathname.startsWith('/platform')) {
      return nextWithPathname();
    }

    // Rewrite all other paths to /platform/licensing/*
    return NextResponse.rewrite(new URL(`/platform/licensing${pathname}`, request.url));
  }

  // Redirect non-www .org to www .org
  if (hostWithoutPort === 'elevateforhumanity.org') {
    const url = request.nextUrl.clone();
    url.host = 'www.elevateforhumanity.org';
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, { status: 308 });
  }

  // ============================================
  // AUTH PROTECTION
  // ============================================

  // Skip auth check for public routes, static files, API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/login' ||
    pathname === '/admin-login' ||
    pathname === '/signup' ||
    pathname === '/unauthorized' ||
    // Admin PWA install page — intentionally public, not linked from nav.
    // Lives outside /admin/ to avoid the admin layout auth gate.
    pathname === '/install-app'
  ) {
    return nextWithPathname();
  }

  // Dashboard landing pages are PUBLIC (exact match only)
  // This allows marketing/preview of dashboard features
  const isPublicDashboardLanding = PUBLIC_DASHBOARD_LANDINGS.some(
    (landing) => pathname === landing || pathname === `${landing}/`,
  );

  if (isPublicDashboardLanding) {
    return nextWithPathname();
  }

  // Admin namespace (/admin/*) is canonicalized to NEXT_PUBLIC_ADMIN_URL above.
  // The LMS middleware does not own /admin route rendering.

  // Check if route requires protection (non-admin routes)
  const protectedRoute = Object.keys(PROTECTED_ROUTES).find((route) => pathname.startsWith(route));
  const authRequired = AUTH_REQUIRED_ROUTES.some((route) => pathname.startsWith(route));

  if (!protectedRoute && !authRequired) {
    return nextWithPathname();
  }

  // Create Supabase client for auth check
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Supabase not configured — fail closed: redirect to login rather than
    // allowing unauthenticated access to protected routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl, { status: 307 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Preserve requestHeaders (which carries x-pathname) when refreshing cookies
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => {
          // Scope auth cookies to root domain so www and app subdomains share the session
          const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
          const cookieOptions = isAuthCookie
            ? { ...options, domain: '.elevateforhumanity.org' }
            : options;
          response.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated - redirect to login with return URL
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl, { status: 307 });
  }

  // Fetch profile ONCE and reuse throughout — avoids 3 separate DB round-trips
  // per request which was causing 2-3s latency on every protected route.
  const { data: cachedProfile } = await supabase
    .from('profiles')
    .select('role, tenant_id, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();

  // ============================================
  // SERVER-SIDE IDLE TIMEOUT (NIST 800-63B)
  // Signs out users after 30 minutes of inactivity.
  // Uses a cookie to track last activity timestamp.
  // ============================================
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const ACTIVITY_COOKIE = 'efh_last_activity';
  const now = Date.now();
  const lastActivity = request.cookies.get(ACTIVITY_COOKIE)?.value;

  if (lastActivity) {
    const lastActivityTime = parseInt(lastActivity, 10);
    if (!isNaN(lastActivityTime) && now - lastActivityTime > IDLE_TIMEOUT_MS) {
      // Session expired due to inactivity — redirect to login with reason=idle.
      // Do NOT call supabase.auth.signOut() here: middleware cannot write the
      // Set-Cookie header that clears the Supabase session token, so the call
      // is a no-op and the session cookie remains valid. The login page detects
      // ?reason=idle and calls supabase.auth.signOut() client-side where the
      // cookie write actually takes effect.
      const idleUrl = new URL('/login', request.url);
      idleUrl.searchParams.set('reason', 'idle');
      const idleResponse = NextResponse.redirect(idleUrl, { status: 307 });
      idleResponse.cookies.delete(ACTIVITY_COOKIE);
      return idleResponse;
    }
  }

  // Update last activity timestamp
  response.cookies.set(ACTIVITY_COOKIE, now.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: IDLE_TIMEOUT_MS / 1000,
  });

  // Check role for protected routes
  if (protectedRoute) {
    const allowedRoles = PROTECTED_ROUTES[protectedRoute];
    if (!cachedProfile || !allowedRoles.includes(cachedProfile.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url), { status: 307 });
    }
  }

  // Check onboarding completion for restricted routes
  const requiresOnboarding = ONBOARDING_REQUIRED_ROUTES.some((route) => pathname.startsWith(route));

  if (requiresOnboarding) {
    // Skip onboarding check for the onboarding pages themselves
    if (pathname.startsWith('/onboarding') || pathname === '/hub/welcome') {
      return response;
    }

    // Admin emails bypass onboarding requirement
    if (ADMIN_EMAILS.includes(user.email || '')) {
      return response;
    }

    // Admins and super_admins bypass onboarding
    if (cachedProfile?.role === 'admin' || cachedProfile?.role === 'super_admin') {
      return response;
    }

    // Gitpod preview domains bypass onboarding gate — dev environment only
    if (isGitpodPreview) {
      return response;
    }

    // Primary gate: profiles.onboarding_completed is readable by the user (no RLS block).
    if (!cachedProfile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding/legal', request.url), { status: 307 });
    }
  }

  // ============================================
  // ENROLLMENT + PARTNER CHECKS (parallel)
  // Both queries run simultaneously — no sequential waterfall.
  // ============================================
  const requiresEnrollment = ENROLLMENT_REQUIRED_ROUTES.some((route) => pathname.startsWith(route));
  const isEnrollmentFlowRoute = ENROLLMENT_FLOW_ROUTES.some((route) => pathname.startsWith(route));
  const isPartnerRoute = PARTNER_ROUTES.some((route) => pathname.startsWith(route));
  const isPartnerOnboardingRoute = PARTNER_ONBOARDING_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const needsEnrollment = requiresEnrollment && !isEnrollmentFlowRoute;
  const needsPartner = isPartnerRoute || isPartnerOnboardingRoute;

  const [enrollmentResult, partnerResult] = await Promise.all([
    needsEnrollment
      ? supabase
          .from('program_enrollments')
          .select('enrollment_state')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    needsPartner
      ? supabase.from('partner_users').select('status, partner_id').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (needsEnrollment && !isGitpodPreview && enrollmentResult.data) {
    const state = enrollmentResult.data.enrollment_state;
    if (state !== 'active' && state !== 'documents_complete') {
      let redirectPath = '/enrollment/confirmed';
      if (state === 'confirmed') redirectPath = '/enrollment/orientation';
      else if (state === 'orientation_complete') redirectPath = '/enrollment/documents';
      return NextResponse.redirect(new URL(redirectPath, request.url), { status: 307 });
    }
  }

  if (needsPartner) {
    const partnerApp = partnerResult.data;
    if (!partnerApp) {
      return NextResponse.redirect(new URL('/partner/apply', request.url), { status: 307 });
    }
    if (isPartnerRoute && partnerApp.status !== 'active') {
      if (
        partnerApp.status === 'pending_documents' ||
        partnerApp.status === 'documents_submitted'
      ) {
        return NextResponse.redirect(new URL('/partner/documents', request.url), { status: 307 });
      }
      return NextResponse.redirect(new URL('/partner/onboarding', request.url), { status: 307 });
    }

    // Inject partner status for downstream handlers
    response.headers.set('x-partner-status', partnerApp.status);
  }

  // ============================================
  // TENANT CONTEXT INJECTION (STEP 4B)
  // ============================================
  // Inject tenant context headers for downstream route handlers
  const tenantId = user.user_metadata?.tenant_id;
  const userRole = user.user_metadata?.role || 'user';

  if (tenantId) {
    response.headers.set('x-tenant-id', tenantId);
  }
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-role', userRole);

  // ============================================
  // NOINDEX FOR INTERNAL PAGES
  // Prevent search engines from indexing portals, admin, and auth-gated routes
  // ============================================
  if (NOINDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

// Sentry's wrappingLoader auto-adds a 'proxy' export — do not add one manually.
export default middleware;

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
