/**
 * POST /api/admin/programs/[programId]/auto-generate-course
 * 
 * Updated to use: lib/course-factory/
 * 
 * Migration: autoGenerateCourseForProgram → courseFactory
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { courseFactory } from '@/lib/course-factory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  if (!programId) return safeError('programId is required', 400);

  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === 'replace' ? 'replace' : 'missing-only';
  const videoMode = body?.videoMode === 'off' ? 'off' : 'queue';
  const videoQueueLimit =
    typeof body?.videoQueueLimit === 'number' ? Number(body.videoQueueLimit) : null;

  try {
    // Use Course Factory
    const result = await courseFactory({
      programId,
      mode,
      contentSource: 'ai',
      videoMode,
      videoQueueLimit,
    });

    if (!result.ok) {
      if (result.status === 'not_found') {
        return safeError(result.errors?.[0] || 'Program not found', 404);
      }
      if (result.status === 'no_blueprint') {
        return NextResponse.json({ 
          ok: false, 
          error: result.errors?.[0] || 'No blueprint found for this program',
          status: result.status 
        }, { status: 422 });
      }
      return NextResponse.json({ 
        ok: false, 
        error: result.errors?.[0] || 'Course generation failed',
        status: result.status,
        warnings: result.warnings 
      }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      courseId: result.courseId,
      courseSlug: result.courseSlug,
      title: result.title,
      moduleCount: result.moduleCount,
      lessonCount: result.lessonCount,
      skippedCount: result.skippedCount,
      warnings: result.warnings,
    }, { status: 200 });
  } catch (error) {
    return safeInternalError(error, 'Auto course generation failed');
  }
}
