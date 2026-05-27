import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import WorkflowsClient from './WorkflowsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Workflow Engine | Admin | Elevate For Humanity',
};

export default async function WorkflowsPage() {
  await requireAdmin();
  const db = await requireAdminClient();

  const { data: workflows } = await db
    .from('workflows')
    .select('*')
    .order('updated_at', { ascending: false });

  const ids = (workflows ?? []).map((w: any) => w.id);
  const [{ data: triggers }, { data: steps }, { data: recentRuns }] = await Promise.all([
    ids.length
      ? db.from('workflow_triggers').select('workflow_id').in('workflow_id', ids)
      : { data: [] },
    ids.length
      ? db.from('workflow_steps').select('workflow_id').in('workflow_id', ids)
      : { data: [] },
    db
      .from('workflow_runs')
      .select('id, workflow_id, status, triggered_by, created_at, completed_at, error_message, workflow:workflows(name, category)')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const triggerCounts = (triggers ?? []).reduce((acc: Record<string, number>, t: any) => {
    acc[t.workflow_id] = (acc[t.workflow_id] ?? 0) + 1;
    return acc;
  }, {});
  const stepCounts = (steps ?? []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.workflow_id] = (acc[s.workflow_id] ?? 0) + 1;
    return acc;
  }, {});

  const enriched = (workflows ?? []).map((w: any) => ({
    ...w,
    trigger_count: triggerCounts[w.id] ?? 0,
    step_count: stepCounts[w.id] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Workflows' }]} />
        <WorkflowsClient workflows={enriched} recentRuns={recentRuns ?? []} />
      </div>
    </div>
  );
}
