/**
 * GET /api/cron/revalidate-public
 * Bust ISR/cache for public marketing catalog pages after deploy or DB catalog changes.
 * AUTH: Enforced via withRuntime({ cron: 'bearer' }) — CRON_SECRET required.
 */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
