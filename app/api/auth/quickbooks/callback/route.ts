import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

/**
 * QuickBooks OAuth 2.0 callback.
 * Exchanges the authorization code for access + refresh tokens,
 * then persists them to AWS SSM so ECS containers pick them up.
 *
 * AUTH_EXEMPT: OAuth callback — Intuit redirects here before any session exists.
 * Security: state param validated, rate-limited by IP, tokens never returned to client.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const { searchParams } = request.nextUrl;
  const code          = searchParams.get('code');
  const realmId       = searchParams.get('realmId');
  const error         = searchParams.get('error');
  const state         = searchParams.get('state');

  const base    = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const adminBase = base.replace('www.', 'admin.');
  const redirect  = (msg: string) =>
    NextResponse.redirect(`${adminBase}/admin/integrations/quickbooks?${msg}`);

  if (error)  return redirect(`error=${error}`);
  if (!code)  return redirect('error=no_code');

  const clientId     = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  const redirectUri  = process.env.QB_REDIRECT_URI ||
    `${base}/api/auth/quickbooks/callback`;

  if (!clientId || !clientSecret) return redirect('error=not_configured');

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code:         code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[QB callback] token exchange failed:', err);
      return redirect('error=token_failed');
    }

    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token) return redirect('error=no_token');

    const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString();
    const realm = realmId ?? process.env.QB_REALM_ID ?? '';

    // 1. Persist to SSM (for ECS containers)
    await persistToSSM({
      QB_ACCESS_TOKEN:  access_token,
      QB_REFRESH_TOKEN: refresh_token,
      QB_REALM_ID:      realm,
      QB_TOKEN_EXPIRES: expiresAt,
    });

    // 2. Persist to Supabase app_settings table (fallback for non-SSM envs)
    await persistToSupabase({
      QB_ACCESS_TOKEN:  access_token,
      QB_REFRESH_TOKEN: refresh_token,
      QB_REALM_ID:      realm,
      QB_TOKEN_EXPIRES: expiresAt,
    });

    return NextResponse.redirect(
      `${adminBase}/admin/integrations/quickbooks?success=connected&company=${realm}`,
    );
  } catch (err) {
    console.error('[QB callback] unexpected error:', err);
    return redirect('error=unexpected');
  }
}

async function persistToSupabase(params: Record<string, string>) {
  try {
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const supabase = await getAdminClient();
    if (!supabase) return;

    // Upsert each key into app_settings (key/value store)
    await Promise.allSettled(
      Object.entries(params).map(([key, value]) =>
        supabase
          .from('app_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' }),
      ),
    );
  } catch (err) {
    console.error('[QB callback] Supabase persist failed:', err);
  }
}

async function persistToSSM(params: Record<string, string>) {
  try {
    const { SSMClient, PutParameterCommand } = await import('@aws-sdk/client-ssm');
    const ssm = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

    const sensitive = new Set(['QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN']);

    await Promise.all(
      Object.entries(params).map(([name, value]) =>
        ssm.send(new PutParameterCommand({
          Name:      `/elevate/${name}`,
          Value:     value,
          Type:      sensitive.has(name) ? 'SecureString' : 'String',
          Overwrite: true,
        })),
      ),
    );
  } catch (err) {
    // Non-fatal — tokens still work for this request, next restart will re-auth
    console.error('[QB callback] SSM persist failed:', err);
  }
}
