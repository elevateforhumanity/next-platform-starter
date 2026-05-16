import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeDbError, safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('scorm_packages')
    .select('id, title, course_id, status, created_at, launch_url')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return safeDbError(error, 'Failed to load SCORM packages');

  return NextResponse.json({ packages: data ?? [] });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const courseId = String(body?.courseId ?? '').trim();
  const scormPackageId = String(body?.scormPackageId ?? '').trim();

  if (!courseId || !scormPackageId) {
    return safeError('courseId and scormPackageId are required', 400);
  }

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('scorm_packages')
    .update({
      course_id: courseId,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', scormPackageId)
    .select('id, title, course_id, status, launch_url')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to link SCORM package');
  if (!data) return safeError('SCORM package not found', 404);

  await db.from('audit_logs').insert({
    user_id: auth.id,
    action: 'course_builder.scorm.linked',
    resource_type: 'scorm_packages',
    resource_id: scormPackageId,
    metadata: {
      courseId,
      scormPackageId,
      launchUrl: data.launch_url,
    },
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, package: data });
}