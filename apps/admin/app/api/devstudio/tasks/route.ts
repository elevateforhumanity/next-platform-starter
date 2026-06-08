import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const RISKY_KEYWORDS = ['migration', 'deploy', 'payment', 'auth', 'delete', 'drop', 'truncate', 'production'];

function detectRisk(description: string): { risky: boolean; reason: string | null } {
  const lower = (description ?? '').toLowerCase();
  for (const kw of RISKY_KEYWORDS) {
    if (lower.includes(kw)) return { risky: true, reason: `Action involves: ${kw}` };
  }
  return { risky: false, reason: null };
}

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('ai_tasks')
    .select('*, ai_agents(name, role)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const db = await requireAdminClient();

  const risk = detectRisk(body.description ?? body.title ?? '');

  const { data, error } = await db
    .from('ai_tasks')
    .insert({
      title: body.title,
      description: body.description,
      agent_id: body.agent_id ?? null,
      priority: body.priority ?? 'medium',
      requires_approval: risk.risky,
      approval_reason: risk.reason,
      status: risk.risky ? 'awaiting_approval' : 'pending',
      plan: body.plan ?? [],
      created_by: auth.user?.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from('dev_audit_logs').insert({
    user_id: auth.user?.id,
    action: 'task_created',
    resource_type: 'ai_task',
    resource_id: data.id,
    metadata: { title: body.title, requires_approval: risk.risky },
  });

  return NextResponse.json({ task: data }, { status: 201 });
}
