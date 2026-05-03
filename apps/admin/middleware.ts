import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/api/health"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const hasSession =
    req.cookies.has("sb-access-token") ||
    req.cookies.has("supabase-auth-token") ||
    req.cookies.has("admin_session");

  if (!hasSession) {
    const loginUrl = new URL("/login", "https://www.elevateforhumanity.org");
    loginUrl.searchParams.set("next", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|images).*)"],
};
