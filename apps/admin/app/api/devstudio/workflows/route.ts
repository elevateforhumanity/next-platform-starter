import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  // Query workflow-related tasks
  const { data, error } = await db
    .from('ai_tasks')
    .select('*, ai_agents(name, role)')
    .in('status', ['pending', 'running', 'completed', 'failed'])
    .order('updated_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workflows: data });
}
