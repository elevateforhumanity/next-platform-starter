// PUBLIC ROUTE (cron): purge Next.js cache for public marketing pages after deploy

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** All public marketing routes that must not serve stale program counts or SEO. */
export const PUBLIC_REVALIDATE_PATHS = [
  '/',
  '/programs',
  '/programs/catalog',
  '/programs/healthcare',
  '/programs/skilled-trades',
  '/programs/technology',
  '/education',
  '/career-training',
  '/impact',
  '/funding',
  '/apply',
  '/enrollment',
  '/about',
  '/contact',
] as const;

async function _GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  for (const path of PUBLIC_REVALIDATE_PATHS) {
    revalidatePath(path);
  }

  logger.info('[cron/revalidate-public] revalidated paths', {
    paths: PUBLIC_REVALIDATE_PATHS,
  });

  return NextResponse.json({
    ok: true,
    revalidated: PUBLIC_REVALIDATE_PATHS,
    at: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return _GET(request);
}
