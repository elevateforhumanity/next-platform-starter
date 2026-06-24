import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/api/get-client-ip';
import {
  contactRateLimit,
  strictRateLimit,
  apiRateLimit,
  authRateLimit,
  paymentRateLimit,
  publicRateLimit,
  pageLoadRateLimit,
  createRateLimitHeaders,
  RATE_LIMITS,
  checkInMemoryRateLimit,
} from '@/lib/rate-limit';

type Tier = 'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public' | 'pageLoad';

const limiters: Record<Tier, { get: () => any }> = {
  strict: strictRateLimit,
  contact: contactRateLimit,
  api: apiRateLimit,
  auth: authRateLimit,
  payment: paymentRateLimit,
  public: publicRateLimit,
  pageLoad: pageLoadRateLimit,
};

const INTERNAL_IP_PREFIXES = ['127.', '::1', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.'];

function isInternalIP(ip: string): boolean {
  return INTERNAL_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

function getWindowMs(tier: Tier): number {
  const windows: Record<Tier, number> = {
    strict: 5 * 60 * 1000,
    contact: 60 * 1000,
    api: 60 * 1000,
    auth: 60 * 1000,
    payment: 60 * 1000,
    public: 60 * 1000,
    pageLoad: 60 * 1000,
  };
  return windows[tier] || 60 * 1000;
}

function useInMemoryFallback(id: string, tier: Tier): NextResponse | null {
  const windowMs = getWindowMs(tier);
  const limit = RATE_LIMITS[tier]?.requests || 60;
  const allowed = checkInMemoryRateLimit(id, limit, windowMs);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  return null;
}

export async function applyRateLimit(
  request: Request,
  tier: Tier = 'contact',
): Promise<NextResponse | null> {
  const limiter = limiters[tier]?.get();
  const failClosed = tier === 'strict';
  const isProduction = process.env.NODE_ENV === 'production';
  const id = getClientIp(request);

  if (isInternalIP(id)) return null;

  if (!limiter) {
    if (failClosed && isProduction) {
      logger.error('[rate-limit] Redis unavailable — failing closed', undefined, { tier });
      return NextResponse.json(
        { error: 'Rate limiting temporarily unavailable' },
        { status: 503 }
      );
    }
    logger.debug('[rate-limit] Redis unavailable — using in-memory fallback', { tier });
    return useInMemoryFallback(id, tier);
  }

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
    const msg = err instanceof Error ? err.message : String(err);
    const isQuotaExhausted = msg.includes('max requests limit exceeded');
    const isCredential = msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized');
    const isMalformedResponse = 
      msg.includes('res.map is not a function') ||
      msg.includes('res.filter is not a function') ||
      msg.includes('Cannot read properties of');
    const isCommandUnavailable = 
      msg.includes('not available') ||
      msg.includes('not a function') ||
      isMalformedResponse;

    if (isCommandUnavailable) {
      if (failClosed) {
        const response = useInMemoryFallback(id, tier);
        if (response) return response;
      }
      logger.debug('[rate-limit] Using in-memory fallback', { tier, ip: id });
      return null;
    }

    if (failClosed) {
      logger.error(`[rate-limit] Redis error — failing closed`, undefined, { tier, error: msg });
      return NextResponse.json(
        { error: 'Rate limiting temporarily unavailable' },
        { status: 503 }
      );
    }

    if (isQuotaExhausted) {
      logger.warn('[rate-limit] Upstash monthly quota exhausted — failing open', { tier });
    } else if (isCredential) {
      logger.error('[rate-limit] Redis credentials invalid — failing open', undefined, {
        tier,
        error: msg,
        action: 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Northflank secrets.',
      });
    } else {
      logger.warn('[rate-limit] Redis unavailable — failing open', { tier, error: msg });
    }
    return null;
  }

  return null;
}
