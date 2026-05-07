import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  contactRateLimit,
  strictRateLimit,
  apiRateLimit,
  authRateLimit,
  paymentRateLimit,
  publicRateLimit,
  pageLoadRateLimit,
  createRateLimitHeaders,
} from '@/lib/rate-limit';

type Tier = 'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public' | 'pageLoad';

const limiters: Record<Tier, { get: () => any }> = {
  strict: strictRateLimit, // 3 req / 5 min
  contact: contactRateLimit, // 3 req / 1 min
  api: apiRateLimit, // 60 req / 1 min
  auth: authRateLimit, // 5 req / 1 min
  payment: paymentRateLimit, // 10 req / 1 min
  public: publicRateLimit, // 5 req / 1 min (public AI tutor)
  pageLoad: pageLoadRateLimit, // 30 req / 1 min (public content endpoints)
};

function getIP(request: Request): string {
  const h = request.headers;
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Check rate limit and return 429 response if exceeded.
 * Returns null if the request is allowed.
 *
 * Usage:
 *   const blocked = await applyRateLimit(request, 'contact');
 *   if (blocked) return blocked;
 */
export async function applyRateLimit(
  request: Request,
  tier: Tier = 'contact',
): Promise<NextResponse | null> {
  const limiter = limiters[tier]?.get();
  if (!limiter) {
    // Redis not configured — fail open. Never block legitimate requests
    // because the rate limiting infrastructure is unavailable.
    logger.warn('[rate-limit] Redis unavailable — failing open', { tier });
    return null;
  }

  const id = getIP(request);

  try {
    const result = await limiter.limit(id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            ...createRateLimitHeaders(result),
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          },
        },
      );
    }
  } catch (err) {
    // Redis error (timeout, connection refused, etc.) — fail open.
    // Log so we know Redis is unhealthy, but never block the request.
    logger.error('[rate-limit] Redis error — failing open', { tier, error: err instanceof Error ? err.message : String(err) });
    return null;
  }

  return null;
}
