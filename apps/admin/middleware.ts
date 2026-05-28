import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIPAsync } from '@/lib/api/admin-ip-guard';

const CANONICAL_ADMIN_HOST = 'admin.elevateforhumanity.org';

// Paths that never require auth
const PUBLIC_PATHS = [
  '/login',
  '/unauthorized',
  '/api/health',
  // Password reset flow — Supabase redirects here with a code before a session exists
  '/auth/confirm',
  '/auth/reset-password',
];

// Derive cookie name from the Supabase URL env var so it survives project migration.
// Format: sb-<project-ref>-auth-token  e.g. sb-cuxzzpsyufcewtmicszk-auth-token
function getSessionCookieName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const match = url.match(/https?:\/\/([^.]+)\./);
  if (match?.[1]) return `sb-${match[1]}-auth-token`;
  // Fallback: hardcoded ref — update if project is migrated
  return 'sb-cuxzzpsyufcewtmicszk-auth-token';
}
const SESSION_COOKIE = getSessionCookieName();

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get('host')?.toLowerCase().split(':')[0] ?? '';

  // Always allow public paths, Next.js internals, and static files
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Only gate protected namespaces.
  // Root / is included because app/page.tsx redirects to /admin — gate it here
  // so unauthenticated users go straight to /login without hitting the layout.
  const isProtected =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/api/admin');

  if (!isProtected) return NextResponse.next();

  // IP allowlist — reads from env var (ADMIN_IP_ALLOWLIST) with DB fallback
  // (platform_settings.ip_allowlist). No-op when neither is set.
  const ipBlocked = await checkAdminIPAsync(req);
  if (ipBlocked) return ipBlocked;

  // Forward pathname to server components via request header so the admin
  // layout can read the current path without relying on unreliable Next.js
  // internal headers (x-invoke-path is not guaranteed).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // Cookie presence check — no Supabase client, no DB round-trip on every request.
  // Role enforcement happens in the admin layout (requireAdmin) and API guards (apiRequireAdmin).
  //
  // @supabase/ssr chunks large tokens across multiple cookies named
  // `<base>.0`, `<base>.1`, etc. Check for the base name OR any chunk.
  const allCookies = req.cookies.getAll();
  const hasSession = allCookies.some(
    (c) => c.name === SESSION_COOKIE || c.name.startsWith(`${SESSION_COOKIE}.`),
  );

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    if (pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://')) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
