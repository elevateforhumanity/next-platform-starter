/**
 * POST /api/auth/saml/callback
 *
 * SAML assertion callback. Active only when SAML_ENABLED=true and
 * SAML_ENTRY_POINT / SAML_CERT are configured in SSM.
 *
 * When SAML is not configured this returns 503 so the IdP gets a clear
 * error instead of a 404 that looks like a routing problem.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (process.env.SAML_ENABLED !== 'true') {
    return NextResponse.json({ error: 'SAML SSO is not enabled on this instance' }, { status: 503 });
  }
  // Full SAML assertion processing requires passport-saml or similar.
  // Wire up here when SAML_ENABLED is activated.
  return NextResponse.json({ error: 'SAML callback handler not yet implemented' }, { status: 501 });
}
