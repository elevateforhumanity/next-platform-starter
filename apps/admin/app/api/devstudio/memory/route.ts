import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const url = new URL(req.url);
  const category = url.searchParams.get('category');

  let query = db.from('ai_memory').select('*').order('updated_at', { ascending: false }).limit(100);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memories: data });
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('ai_memory')
    .insert({
      agent_id: body.agent_id ?? null,
      category: body.category ?? 'general',
      key: body.key,
      value: body.value,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from('dev_audit_logs').insert({
    user_id: auth.user?.id,
    action: 'memory_stored',
    resource_type: 'ai_memory',
    resource_id: data.id,
    metadata: { key: body.key, category: body.category },
  });

  return NextResponse.json({ memory: data }, { status: 201 });
}
