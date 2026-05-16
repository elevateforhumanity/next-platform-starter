/**
 * POST /api/devstudio/shell-token
 *
 * Issues a short-lived HMAC token (60s TTL) that the browser passes as
 * X-Studio-Token on the WebSocket upgrade request. This sidesteps the
 * unreliability of cookie forwarding on WebSocket upgrades.
 *
 * Only admin users can obtain a token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_SECRET = process.env.STUDIO_TOKEN_SECRET ?? process.env.STUDIO_SHELL_SECRET ?? '';
const TTL_MS = 60_000;

export async function POST(request: NextRequest) {
  // 'api' tier (60 req/min) — fails open when Redis is absent so the shell
  // stays usable without Upstash configured. The real gate is apiRequireAdmin.
  // 'strict' would fail closed (503) when Redis is unavailable.
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  if (!TOKEN_SECRET) {
    return NextResponse.json(
      { error: 'STUDIO_TOKEN_SECRET not configured' },
      { status: 503 },
    );
  }

  const payload = Buffer.from(
    JSON.stringify({ uid: auth.id, exp: Date.now() + TTL_MS }),
  ).toString('base64url');

  const sig = createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');

  return NextResponse.json({ token: `${payload}.${sig}` });
}
