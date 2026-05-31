// PUBLIC ROUTE: Kubernetes/ECS readiness probe — DB + critical env only (lighter than /api/health)
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET() {
  const criticalEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missingEnv = criticalEnv.filter((k) => !process.env[k]);

  let databaseOk = false;
  if (missingEnv.length === 0) {
    try {
      const db = await requireAdminClient();
      if (db) {
        const { error } = await db.from('programs').select('id').limit(1);
        databaseOk = !error;
      }
    } catch {
      databaseOk = false;
    }
  }

  const ready = missingEnv.length === 0 && databaseOk;
  return NextResponse.json(
    {
      ready,
      timestamp: new Date().toISOString(),
      checks: {
        environment: missingEnv.length === 0,
        database: databaseOk,
        missing_env: missingEnv,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

export const GET = withRuntime(_GET);
