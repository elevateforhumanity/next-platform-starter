import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/unauthorized', '/api/health'];

function getSafeRedirectPath(req: NextRequest) {
  const rawPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  if (!rawPath.startsWith('/') || rawPath.startsWith('//') || rawPath.includes('://')) {
    return '/admin/dashboard';
  }
  return rawPath;
}

function getLoginUrl(req: NextRequest) {
  // Redirect to the admin app's own login page — no cross-domain handoff
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('redirect', getSafeRedirectPath(req));
  return loginUrl;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[apps/admin middleware] Missing Supabase env vars', {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
    });
    return NextResponse.redirect(getLoginUrl(req));
  }

  let response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Match the root-domain scope set by the LMS login so the session
          // written on www.elevateforhumanity.org is readable here on app.
          const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
          const cookieOptions = isAuthCookie
            ? { ...options, domain: '.elevateforhumanity.org' }
            : options;
          response.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(getLoginUrl(req));
    }

    // Role check — only admin-level roles may access the admin app
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const ALLOWED_ROLES = ['admin', 'super_admin', 'staff', 'org_admin', 'instructor'];

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      // Authenticated but wrong role — send to unauthorized, not login
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return response;
  } catch (error) {
    console.error('[apps/admin middleware] Failed to load auth user', error);
    return NextResponse.redirect(getLoginUrl(req));
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * Must be a literal regex — no variables or imports.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
