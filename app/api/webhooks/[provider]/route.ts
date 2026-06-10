import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDER_TARGETS: Record<string, string> = {
  jotform: '/api/webhooks/jotform',
  stripe: '/api/webhooks/stripe',
  marketplace: '/api/webhooks/marketplace',
  store: '/api/webhooks/store',
  sendgrid: '/api/webhooks/sendgrid-inbound',
};

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const targetPath = PROVIDER_TARGETS[params.provider?.toLowerCase()];
  if (!targetPath) return safeError('Unsupported webhook provider', 404);
  const target = new URL(targetPath, request.url);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  return fetch(target, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
}

export async function GET(_request: NextRequest, { params }: { params: { provider: string } }) {
  return NextResponse.json({ ok: true, provider: params.provider, supported: Object.keys(PROVIDER_TARGETS) });
}
