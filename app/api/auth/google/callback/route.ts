/**
 * GET /api/auth/google/callback
 *
 * Google OAuth callback. Supabase handles Google OAuth natively via
 * signInWithOAuth({ provider: 'google' }) — this route is only needed
 * for custom Google OAuth flows outside of Supabase Auth.
 *
 * For standard Supabase Google OAuth, the callback goes to
 * /auth/callback (handled by Supabase's PKCE flow), not here.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  if (process.env.GOOGLE_OAUTH_ENABLED !== 'true') {
    return NextResponse.redirect(new URL('/login?error=google_sso_disabled', req.url));
  }
  // Exchange code via Supabase OAuth — redirect to /auth/callback for PKCE
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error || !data.url) {
    return NextResponse.redirect(new URL('/login?error=google_oauth_failed', req.url));
  }
  return NextResponse.redirect(data.url);
}
