import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { approveTask } from '@/lib/devstudio/os/task-runner';
import { jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const db = await requireAdminClient();
    await approveTask(db, id, auth.id);
    const { data: task } = await db.from('ai_tasks').select('*').eq('id', id).single();
    return jsonOk({ task, approved: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('not found')) return tableNotReadyResponse();
    return safeInternalError(err, 'Failed to approve task');
  }
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = await requireAdminClient();

  const { data: task, error: fetchErr } = await db
    .from('ai_tasks')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (task.status !== 'awaiting_approval') {
    return NextResponse.json({ error: 'Task is not awaiting approval' }, { status: 400 });
  }

  const { error } = await db
    .from('ai_tasks')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from('ai_approvals').insert({
    task_id: id,
    approved_by: auth.user?.id,
    status: 'approved',
    decided_at: new Date().toISOString(),
  });

  await db.from('dev_audit_logs').insert({
    user_id: auth.user?.id,
    action: 'task_approved',
    resource_type: 'ai_task',
    resource_id: id,
  });

  return NextResponse.json({ success: true, status: 'approved' });
}
