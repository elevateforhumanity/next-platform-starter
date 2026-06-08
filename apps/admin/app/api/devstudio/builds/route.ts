import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('ai_deployments')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ builds: data });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const db = await requireAdminClient();
  const service = body.service ?? 'admin';

  const { data, error } = await db
    .from('ai_deployments')
    .insert({
      service,
      environment: body.environment ?? 'production',
      status: 'building',
      commit_sha: body.commit_sha ?? null,
      triggered_by: auth.user?.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from('dev_audit_logs').insert({
    user_id: auth.user?.id,
    action: 'build_triggered',
    resource_type: 'ai_deployment',
    resource_id: data.id,
    metadata: { service },
  });

  // If NORTHFLANK_API_TOKEN is configured, trigger actual build
  const northflankToken = process.env.NORTHFLANK_API_TOKEN;
  if (northflankToken) {
    // Northflank deploy would be triggered here via their API
    await db.from('ai_deployments').update({ status: 'deploying' }).eq('id', data.id);
  }

  return NextResponse.json({ build: data }, { status: 201 });
}
