/**
 * POST /api/admin/course-builder/compile
 *
 * Updated to use: lib/course-factory/
 * 
 * Migration: compileBlueprintToCourse → courseFactory
 *
 * Runs full curriculum through Course Factory.
 * Expands modules, injects quizzes/labs/exam, validates, and persists to DB.
 *
 * Body: { template: CourseTemplate, mode?: 'missing-only' | 'replace', dryRun?: boolean }
 * Returns: { success, plan, pipelineResult, errors }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { courseFactory } from '@/lib/course-factory';
import type { CredentialBlueprint } from '@/lib/course-factory';

export const dynamic = 'force-dynamic';

interface CompileRequest {
  programId?: string;
  programSlug?: string;
  blueprint: CredentialBlueprint;
  mode?: 'replace' | 'missing-only';
  dryRun?: boolean;
}

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: CompileRequest;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  if (!body.blueprint) return safeError('blueprint is required', 400);
  if (!body.programId && !body.programSlug) {
    return safeError('programId or programSlug is required', 400);
  }

  try {
    const result = await courseFactory({
      programId: body.programId,
      programSlug: body.programSlug,
      blueprint: body.blueprint,
      mode: body.mode ?? 'missing-only',
      contentSource: 'blueprint',
    });

    if (!result.ok) {
      return NextResponse.json({
        success: false,
        errors: result.errors,
        warnings: result.warnings,
        status: result.status,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      courseId: result.courseId,
      courseSlug: result.courseSlug,
      title: result.title,
      moduleCount: result.moduleCount,
      lessonCount: result.lessonCount,
      skippedCount: result.skippedCount,
      warnings: result.warnings,
    }, { status: 200 });
  } catch (err) {
    return safeInternalError(err, 'Course factory failed');
  }
}
