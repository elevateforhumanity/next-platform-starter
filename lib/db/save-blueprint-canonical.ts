/**
 * lib/db/save-blueprint-canonical.ts
 *
 * Persist an AI-generated CourseBlueprint to the canonical LMS tables:
 *   courses → course_modules → course_lessons
 *
 * This replaces saveCourseBlueprint (lib/db/courses.ts) which wrote to
 * training_courses + training_lessons (legacy tables). All new courses
 * must go through this function so they appear in lms_lessons and on /programs.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import type { CourseBlueprint } from '@/lib/ai/course-ingestion';

export interface SaveBlueprintResult {
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  questionCount: number;
}

export async function saveBlueprintToCanonical(
  blueprint: CourseBlueprint,
  options: { program_id?: string | null; created_by?: string | null } = {},
): Promise<SaveBlueprintResult> {
  const db = await requireAdminClient();

  // 1. Upsert course row
  const { data: course, error: courseErr } = await db
    .from('courses')
    .insert({
      title: blueprint.title,
      description: blueprint.description ?? null,
      program_id: options.program_id ?? null,
      published: false,
      generation_status: 'draft',
      created_by: options.created_by ?? null,
      // Store certificate config in metadata
      metadata: {
        certificate_enabled: blueprint.certificate_enabled ?? false,
        certificate_title: blueprint.certificate_title ?? null,
        passing_score: blueprint.passing_score ?? 70,
        skill_level: blueprint.skill_level ?? 'beginner',
        estimated_duration_hours: blueprint.estimated_duration_hours ?? null,
        category: blueprint.category ?? null,
      },
    })
    .select('id')
    .maybeSingle();

  if (courseErr || !course) {
    throw new Error(`Failed to create course: ${courseErr?.message ?? 'unknown error'}`);
  }

  const courseId = course.id;
  let lessonCount = 0;

  // 2. Create modules + lessons
  for (const [mi, mod] of (blueprint.modules ?? []).entries()) {
    const { data: moduleRow, error: modErr } = await db
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: mod.title,
        description: mod.description ?? null,
        order_index: mod.order_index ?? mi,
      })
      .select('id')
      .maybeSingle();

    if (modErr || !moduleRow) continue;

    const lessons = (mod.lessons ?? []).map((lesson, li) => {
      // Infer step_type from content_type or lesson title
      const stepType = inferStepType(lesson.content_type, lesson.title);

      return {
        course_id: courseId,
        module_id: moduleRow.id,
        title: lesson.title,
        description: lesson.description ?? null,
        content: lesson.compiled?.narration_script ?? lesson.content ?? null,
        order_index: lesson.order_index ?? li,
        lesson_order: li + 1,
        module_order: mi + 1,
        duration_minutes: lesson.duration_minutes ?? null,
        step_type: stepType,
        lesson_type: stepType,
        is_published: false,
        approved: false,
        // Store quiz questions in the canonical column
        quiz_questions: lesson.compiled?.quiz_questions?.length
          ? lesson.compiled.quiz_questions
          : null,
        passing_score:
          stepType === 'checkpoint' || stepType === 'quiz' || stepType === 'exam' ? 70 : null,
        // Store full compiled assets in activities JSONB
        activities: lesson.compiled
          ? {
              learning_objectives: lesson.compiled.learning_objectives,
              slide_outline: lesson.compiled.slide_outline,
              examples: lesson.compiled.examples,
            }
          : null,
      };
    });

    if (lessons.length) {
      const { error: lessonErr } = await db.from('course_lessons').insert(lessons);
      if (!lessonErr) lessonCount += lessons.length;
    }
  }

  return {
    courseId,
    moduleCount: blueprint.modules?.length ?? 0,
    lessonCount,
    questionCount: blueprint.quiz_questions?.length ?? 0,
  };
}

function inferStepType(contentType: string | undefined, title: string): string {
  const t = (contentType ?? '').toLowerCase();
  const titleLower = title.toLowerCase();

  if (t === 'quiz' || titleLower.includes('quiz')) return 'quiz';
  if (t === 'exam' || titleLower.includes('exam') || titleLower.includes('final')) return 'exam';
  if (t === 'checkpoint' || titleLower.includes('checkpoint')) return 'checkpoint';
  if (t === 'lab' || titleLower.includes('lab') || titleLower.includes('practical')) return 'lab';
  if (t === 'assignment' || titleLower.includes('assignment')) return 'assignment';
  return 'lesson';
}
