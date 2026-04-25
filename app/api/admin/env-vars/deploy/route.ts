/**
 * POST /api/admin/env-vars/deploy
 *
 * Manually triggers a Netlify redeploy via the build hook.
 * Required when NEXT_PUBLIC_ keys are changed — those are inlined at build time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const hookUrl = process.env.NETLIFY_BUILD_HOOK || process.env.NETLIFY_BUILD_HOOK_URL;
  if (!hookUrl) {
    return NextResponse.json({ triggered: false, reason: 'NETLIFY_BUILD_HOOK not set' });
  }

  try {
    const res = await fetch(hookUrl, { method: 'POST' });
    if (!res.ok) {
      logger.warn('[env-vars/deploy] Netlify hook returned non-OK', { status: res.status });
      return safeError('Netlify deploy hook returned an error', 502);
    }

    logger.info('[env-vars/deploy] Redeploy triggered', { userId: auth.user.id });
    return NextResponse.json({ triggered: true });
  } catch (err) {
    logger.error('[env-vars/deploy] Hook request failed', { error: err instanceof Error ? err.message : String(err) });
    return safeError('Deploy hook request failed', 502);
  }
}
