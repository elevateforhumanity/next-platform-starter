<<<<<<< HEAD
/**
 * GET /api/cron/revalidate-public
 * Bust ISR/cache for public marketing catalog pages after deploy or DB catalog changes.
 * AUTH: Enforced via withRuntime({ cron: 'bearer' }) — CRON_SECRET required.
 */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withRuntime } from '@/lib/api/withRuntime';
=======
// PUBLIC ROUTE (cron): purge Next.js cache for public marketing pages after deploy

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
>>>>>>> origin/cursor/platform-e2e-audit-c4c6

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

<<<<<<< HEAD
const PUBLIC_PATHS = ['/', '/programs', '/education', '/apply', '/programs/catalog'] as const;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  for (const path of PUBLIC_PATHS) {
    revalidatePath(path);
  }
  return NextResponse.json({
    ok: true,
    revalidated: [...PUBLIC_PATHS],
    timestamp: new Date().toISOString(),
  });
});
=======
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
>>>>>>> origin/cursor/platform-e2e-audit-c4c6
