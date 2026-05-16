import { NextResponse } from 'next/server';
import { ProgramCreateSchema } from '@/lib/validators/course';
import { createProgram, listPrograms } from '@/lib/db/courses';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const data = await listPrograms({ status });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json().catch(() => null);
    const parsed = ProgramCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = await createProgram(parsed.data);

    // Log audit
    const db = await createClient();
    await db.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.role,
      action: 'create',
      resource_type: 'program',
      resource_id: data.id,
      after_state: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/programs', _GET);
export const POST = withApiAudit('/api/admin/programs', _POST);
