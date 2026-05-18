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
import { hydrateProcessEnv } from '@/lib/secrets';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Do NOT read secret at module load time — process.env is empty until
// hydrateProcessEnv() runs at request time. Read inside the handler.
const TTL_MS = 60_000;

export async function POST(request: NextRequest) {
  // Hydrate runtime secrets first so STUDIO_TOKEN_SECRET / STUDIO_SHELL_SECRET
  // are available from platform_secrets before we check them.
  await hydrateProcessEnv();

  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // Read at request time — after hydrateProcessEnv()
  const TOKEN_SECRET = process.env.STUDIO_TOKEN_SECRET ?? process.env.STUDIO_SHELL_SECRET ?? '';

  if (!TOKEN_SECRET) {
    return NextResponse.json(
      { error: 'STUDIO_TOKEN_SECRET not configured — set STUDIO_SHELL_SECRET in Admin → Integrations' },
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
