/**
 * GET /api/admin/apprenticeships/pending-hours
 * Returns progress_entries with status='pending', joined to profile + program.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  const { data: entries, error } = await db
    .from('progress_entries')
    .select(`
      id, status, created_at,
      profiles:student_id(full_name, email),
      apprenticeship_programs:program_id(name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ entries: [] });
  return NextResponse.json({ entries: entries ?? [] });
}
