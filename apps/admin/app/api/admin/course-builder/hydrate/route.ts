/**
 * POST /api/admin/course-builder/hydrate
 *
 * Updated to use: lib/course-factory/
 * 
 * Migration: assessment-generator → content-generator
 *
 * Generates and persists assessment questions for a lesson.
 * Supports module quiz generation and final exam generation.
 *
 * Body:
 *   { lessonId, lessonType: 'checkpoint'|'quiz'|'exam', moduleTitle?, courseTitle?,
 *     domainKey?, competencyKeys?, questionCount?, passingScore?,
 *     domainDistribution?, replaceExisting? }
 *
 * Returns: { lessonId, writtenToDb, questionCount, errors }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { generateAssessment, generateFinalExam } from '@/lib/course-factory/content-generator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface HydrateBody {
  lessonId: string;
  lessonType: 'checkpoint' | 'quiz' | 'exam';
  moduleTitle?: string;
  courseTitle?: string;
  domainKey?: string;
  competencyKeys?: string[];
  questionCount?: number;
  passingScore?: number;
  replaceExisting?: boolean;
}

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: HydrateBody;

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  if (!body.lessonId) return safeError('lessonId is required', 400);
  if (!body.lessonType) return safeError('lessonType is required', 400);

  const db = await requireAdminClient();

  try {
    const errors: string[] = [];
    let questionCount = 0;
    let writtenToDb = false;

    if (body.lessonType === 'exam') {
      if (!body.courseTitle) return safeError('courseTitle is required for exam generation', 400);
      
      const exam = await generateFinalExam(
        body.courseTitle,
        8, // Default module count
        body.questionCount ?? 50
      );
      
      await db
        .from('course_lessons')
        .update({ 
          quiz_questions: exam.questions,
          passing_score: body.passingScore ?? 80,
        })
        .eq('id', body.lessonId);
      
      questionCount = exam.questions.length;
      writtenToDb = true;
      logger.info('[hydrate] Final exam generated', { lessonId: body.lessonId, count: questionCount });
      
    } else {
      if (!body.moduleTitle)
        return safeError('moduleTitle is required for quiz/checkpoint generation', 400);
      
      const quiz = await generateAssessment({
        lessonSlug: body.lessonId,
        lessonTitle: body.lessonId,
        moduleTitle: body.moduleTitle,
        courseTitle: body.courseTitle ?? body.moduleTitle,
        questionCount: body.questionCount ?? 10,
      });
      
      await db
        .from('course_lessons')
        .update({ 
          quiz_questions: quiz.questions,
          passing_score: body.passingScore ?? 70,
        })
        .eq('id', body.lessonId);
      
      questionCount = quiz.questions.length;
      writtenToDb = true;
      logger.info('[hydrate] Module quiz generated', { lessonId: body.lessonId, count: questionCount });
    }

    return NextResponse.json({
      lessonId: body.lessonId,
      writtenToDb,
      questionCount,
      errors,
    }, { status: 200 });
    
  } catch (err) {
    logger.error('[hydrate] Assessment generation failed', err);
    return safeInternalError(err, 'Hydration failed');
  }
}
