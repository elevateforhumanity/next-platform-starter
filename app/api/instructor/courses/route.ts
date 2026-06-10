import { NextRequest, NextResponse } from 'next/server';
import { apiRequireInstructor } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireInstructor(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const { data, error } = await db
      .from('lms_courses')
      .select('id, title, course_name, slug, status, program_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return safeDbError(error, 'Instructor courses list failed');
    return NextResponse.json({ courses: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Instructor courses list failed');
  }
}
