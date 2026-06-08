import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { createAiTask } from '@/lib/devstudio/os/task-runner';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '30', 10), 100);
  const status = request.nextUrl.searchParams.get('status');

  try {
    const db = await requireAdminClient();
    let query = db
      .from('ai_tasks')
      .select(
        'id, title, description, status, priority, agent_id, trace_id, requires_approval, risk_tags, created_at, updated_at, completed_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ tasks: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load tasks');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? '').trim();
    if (!title) return safeError('title is required', 400);

    const db = await requireAdminClient();
    const task = await createAiTask(db, {
      title,
      description: body.description ? String(body.description) : undefined,
      agentSlug: body.agentSlug ? String(body.agentSlug) : undefined,
      command: body.command ? String(body.command) : undefined,
      requestedBy: auth.id,
      priority: typeof body.priority === 'number' ? body.priority : undefined,
      traceId: body.traceId ? String(body.traceId) : undefined,
    });

    return jsonOk({ task }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create task';
    if (message.includes('not found') && message.includes('ai_')) {
      return tableNotReadyResponse();
    }
    return safeInternalError(err, 'Failed to create task');
  }
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
