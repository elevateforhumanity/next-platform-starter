import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { executeWorkflow } from '@/lib/workflows/engine';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

// POST /api/admin/workflows/run — manually trigger a workflow
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { workflow_id, payload } = body;
  if (!workflow_id) return NextResponse.json({ error: 'workflow_id required' }, { status: 400 });

  const result = await executeWorkflow(workflow_id, 'manual', payload ?? {});
  return NextResponse.json(result, { status: result.status === 'failed' ? 500 : 200 });
}
