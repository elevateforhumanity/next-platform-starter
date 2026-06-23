/**
 * POST /api/admin/course-builder/publish
 * 
 * Updated to use: lib/course-factory/
 * 
 * Migration: runCoursePublishPipeline → publishCourse
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { publishCourse } from '@/lib/course-factory';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import type { BlueprintModule } from '@/lib/course-factory';

export const dynamic = 'force-dynamic';

interface PublishRequest {
  programId: string;
  courseSlug: string;
  courseTitle: string;
  modules: BlueprintModule[];
  mode?: 'replace' | 'missing-only';
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as PublishRequest;

    // Basic validation
    if (!body.programId) {
      return NextResponse.json({ ok: false, error: 'programId is required' }, { status: 400 });
    }
    if (!body.modules || body.modules.length === 0) {
      return NextResponse.json({ ok: false, error: 'modules are required' }, { status: 400 });
    }

    // Use Course Factory Publisher
    const result = await publishCourse({
      programId: body.programId,
      courseSlug: body.courseSlug || `course-${Date.now()}`,
      courseTitle: body.courseTitle || 'Untitled Course',
      blueprint: body.modules,
      mode: body.mode || 'missing-only',
    });

    return NextResponse.json({
      ok: result.success,
      courseId: result.courseId,
      moduleCount: result.moduleCount,
      lessonCount: result.lessonCount,
      skippedCount: result.skippedCount,
      warnings: result.warnings,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('[course-builder/publish]', error);
    return NextResponse.json({ ok: false, error: 'Failed to publish course' }, { status: 500 });
  }
}
