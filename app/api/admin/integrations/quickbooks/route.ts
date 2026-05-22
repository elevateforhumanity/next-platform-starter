/**
 * QuickBooks Online admin integration API.
 * Handles status checks, OAuth URL generation, sync actions, and disconnect.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QB_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company';
const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';

function getQbConfig() {
  return {
    clientId: process.env.QB_CLIENT_ID ?? '',
    clientSecret: process.env.QB_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.QB_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org'}/api/auth/quickbooks/callback`,
    accessToken: process.env.QB_ACCESS_TOKEN ?? '',
    refreshToken: process.env.QB_REFRESH_TOKEN ?? '',
    realmId: process.env.QB_REALM_ID ?? '',
    tokenExpires: process.env.QB_TOKEN_EXPIRES ?? '',
  };
}

function isTokenValid(expires: string): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date(Date.now() + 60_000); // 1 min buffer
}

/** GET ?action=status|auth_url */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const action = request.nextUrl.searchParams.get('action') ?? 'status';
  const cfg = getQbConfig();

  if (action === 'auth_url') {
    if (!cfg.clientId) return safeError('QB_CLIENT_ID not configured', 503);
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      state: crypto.randomUUID(),
    });
    return NextResponse.json({ auth_url: `${QB_AUTH_URL}?${params}` });
  }

  // action === 'status'
  const connected = Boolean(cfg.accessToken && cfg.realmId && isTokenValid(cfg.tokenExpires));

  if (!connected) {
    return NextResponse.json({
      connected: false,
      message: cfg.clientId ? 'Token expired or not connected' : 'QB_CLIENT_ID not configured',
    });
  }

  // Try to fetch company info
  try {
    const res = await fetch(`${QB_BASE_URL}/${cfg.realmId}/companyinfo/${cfg.realmId}`, {
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        Accept: 'application/json',
      },
    });
    if (res.ok) {
      const d = await res.json();
      const name = d?.CompanyInfo?.CompanyName ?? '';
      return NextResponse.json({
        connected: true,
        realm_id: cfg.realmId,
        company_name: name,
        last_sync: null,
      });
    }
  } catch (err) {
    logger.warn('[QB status] company info fetch failed', err);
  }

  return NextResponse.json({ connected: true, realm_id: cfg.realmId, company_name: '' });
}

/** POST { action: 'sync_payroll' | 'sync_expenses' | 'disconnect' } */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { action } = body;
  const cfg = getQbConfig();

  if (action === 'disconnect') {
    // Revoke token with Intuit
    if (cfg.accessToken) {
      try {
        await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({ token: cfg.accessToken }),
        });
      } catch (err) {
        logger.warn('[QB disconnect] revoke failed', err);
      }
    }
    // Clear SSM params
    await clearSSMParams(['QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID', 'QB_TOKEN_EXPIRES']);
    return NextResponse.json({ message: 'QuickBooks disconnected' });
  }

  if (action === 'sync_payroll') {
    if (!cfg.accessToken || !cfg.realmId) return safeError('QuickBooks not connected', 400);
    try {
      const res = await fetch(
        `${QB_BASE_URL}/${cfg.realmId}/query?query=SELECT * FROM Employee MAXRESULTS 100`,
        { headers: { Authorization: `Bearer ${cfg.accessToken}`, Accept: 'application/json' } },
      );
      if (!res.ok) return safeError('QuickBooks API error', 502);
      const d = await res.json();
      const count = d?.QueryResponse?.Employee?.length ?? 0;
      return NextResponse.json({ message: `Synced ${count} employee records from QuickBooks` });
    } catch (err) {
      return safeInternalError(err, 'Payroll sync failed');
    }
  }

  if (action === 'sync_expenses') {
    if (!cfg.accessToken || !cfg.realmId) return safeError('QuickBooks not connected', 400);
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await fetch(
        `${QB_BASE_URL}/${cfg.realmId}/query?query=SELECT * FROM Purchase WHERE MetaData.LastUpdatedTime > '${since}' MAXRESULTS 100`,
        { headers: { Authorization: `Bearer ${cfg.accessToken}`, Accept: 'application/json' } },
      );
      if (!res.ok) return safeError('QuickBooks API error', 502);
      const d = await res.json();
      const count = d?.QueryResponse?.Purchase?.length ?? 0;
      return NextResponse.json({ message: `Synced ${count} expense records from last 30 days` });
    } catch (err) {
      return safeInternalError(err, 'Expense sync failed');
    }
  }

  return safeError('Unknown action', 400);
}

async function clearSSMParams(names: string[]) {
  try {
    const { SSMClient, DeleteParameterCommand } = await import('@aws-sdk/client-ssm');
    const ssm = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
    await Promise.allSettled(
      names.map((n) => ssm.send(new DeleteParameterCommand({ Name: `/elevate/${n}` }))),
    );
  } catch {
    // Non-fatal
  }
}
