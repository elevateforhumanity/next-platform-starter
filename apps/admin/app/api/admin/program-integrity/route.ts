/**
 * GET /api/admin/program-integrity
 *
 * Returns program integrity scores from the program_integrity view.
 * Sorted ascending by score so the worst programs appear first.
 *
 * Query params:
 *   limit  — max rows (default 20, max 100)
 *   min    — only return programs with score <= this value (default 100 = all)
 *
 * Admin-only. Cached 5 minutes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const maxScore = parseInt(searchParams.get('min') ?? '100', 10);

  const db = await getAdminClient();
  if (!db) {
    return NextResponse.json({
      programs: [],
      pending_migration: true,
      reason: 'admin_client_unavailable',
    });
  }

  const { data, error } = await db
    .from('program_integrity')
    .select(
      'id, slug, title, status, category, published, is_active, ' +
      'total_lessons, total_modules, active_enrollments, certificates_issued, ' +
      'has_course_row, has_completion_rule, integrity_score, failing_checks',
    )
    .lte('integrity_score', maxScore)
    .order('integrity_score', { ascending: true })
    .limit(limit);

  if (error) {
    // View may not exist yet, or may be from an older migration with different columns.
    // Return empty rather than 500 so dashboard degrades gracefully.
    if (['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(error.code ?? '')) {
      return NextResponse.json({
        programs: [],
        pending_migration: true,
        reason: error.code,
      });
    }
    return safeError('Failed to load program integrity data', 500);
  }

  return NextResponse.json(
    { programs: data ?? [] },
    { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' } },
  );
}
