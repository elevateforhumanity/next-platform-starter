/**
 * POST /api/auth/azure/callback
 *
 * Azure AD OIDC callback. Active only when AZURE_AD_ENABLED=true and
 * AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_TENANT_ID are set in SSM.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (process.env.AZURE_AD_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Azure AD SSO is not enabled on this instance' }, { status: 503 });
  }
  return NextResponse.json({ error: 'Azure AD callback handler not yet implemented' }, { status: 501 });
}
