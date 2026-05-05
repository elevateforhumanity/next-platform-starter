import { NextResponse, type NextRequest } from 'next/server';

// Paths that never require auth
const PUBLIC_PATHS = ['/login', '/unauthorized', '/api/health'];

// Supabase sets sb-<project-ref>-auth-token
// Project ref: cuxzzpsyufcewtmicszk
const SESSION_COOKIE = 'sb-cuxzzpsyufcewtmicszk-auth-token';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths, Next.js internals, and static files
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Only gate protected namespaces
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/api/admin');

  if (!isProtected) return NextResponse.next();

  // Cookie presence check — no Supabase client, no DB round-trip on every request.
  // Role enforcement happens in the admin layout (requireAdmin) and API guards (apiRequireAdmin).
  const hasSession = req.cookies.get(SESSION_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    if (pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://')) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
