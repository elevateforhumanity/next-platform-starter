/**
 * POST /api/internal/run-migrations
 *
 * One-shot migration runner. Bootstraps a _migration_exec() function via the
 * pg extension endpoint, then runs the provided SQL through it.
 * Protected by CRON_SECRET. THIS FILE IS DELETED AFTER USE.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { migration_name, sql } = await request.json();
  if (!sql?.trim()) {
    return NextResponse.json({ error: 'sql required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  };

  // Step 1: bootstrap _migration_exec via pg extension
  const bootstrap = `CREATE OR REPLACE FUNCTION public._migration_exec(p_sql text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE p_sql; END; $$;`;

  const pgRes = await fetch(`${supabaseUrl}/pg/query`, {
    method: 'POST', headers,
    body: JSON.stringify({ query: bootstrap }),
  });

  if (!pgRes.ok) {
    const pgBody = await pgRes.text();
    // pg endpoint not available — try calling existing _migration_exec
    const testRes = await fetch(`${supabaseUrl}/rest/v1/rpc/_migration_exec`, {
      method: 'POST', headers,
      body: JSON.stringify({ p_sql: 'SELECT 1' }),
    });
    if (!testRes.ok) {
      return NextResponse.json({
        error: 'No SQL execution path available',
        pg_error: pgBody,
        action: 'Apply manually in Supabase Dashboard → SQL Editor',
        files: [
          'supabase/migrations/20260701000001_fix_completion_trigger_table_split.sql',
          'supabase/migrations/20260701000002_stale_application_archive.sql',
          'supabase/migrations/20260701000003_program_integrity_view.sql',
        ],
      }, { status: 503 });
    }
  }

  // Step 2: run the migration
  const runRes = await fetch(`${supabaseUrl}/rest/v1/rpc/_migration_exec`, {
    method: 'POST', headers,
    body: JSON.stringify({ p_sql: sql }),
  });

  const runBody = await runRes.text();
  if (!runRes.ok) {
    return NextResponse.json({ error: runBody, migration: migration_name }, { status: 500 });
  }

  return NextResponse.json({ ok: true, migration: migration_name });
}
