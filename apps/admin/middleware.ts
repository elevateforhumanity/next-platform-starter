import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalLoginBaseUrl } from './lib/login-url';

const PUBLIC_ROUTES = ['/login', '/api/health'];

function getSafeRedirectPath(req: NextRequest) {
  const rawPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  if (!rawPath.startsWith('/') || rawPath.startsWith('//') || rawPath.includes('://')) {
    return '/admin/dashboard';
  }
  return rawPath;
}

function getLoginUrl(req: NextRequest) {
  const loginUrl = new URL('/login', getCanonicalLoginBaseUrl());
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
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
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
    return response;
  } catch (error) {
    console.error('[apps/admin middleware] Failed to load auth user', error);
    return NextResponse.redirect(getLoginUrl(req));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|images).*)'],
};
