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

  const { error } = await db
    .from('ai_tasks')
    .update({ status: 'rolled_back', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from('dev_audit_logs').insert({
    user_id: auth.user?.id,
    action: 'task_rolled_back',
    resource_type: 'ai_task',
    resource_id: id,
  });

  return NextResponse.json({ success: true, status: 'rolled_back' });
}
