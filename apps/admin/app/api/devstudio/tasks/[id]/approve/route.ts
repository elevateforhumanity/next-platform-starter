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
