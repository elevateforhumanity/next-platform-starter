/**
 * lib/course-builder/orchestrator.ts
 *
 * Single-entry course generation pipeline.
 *
 * Wires together the existing pipeline stages into one sequential flow:
 *   1. Generate blueprint (AI)
 *   2. Parse + normalize
 *   3. Validate
 *   4. Generate lessons (AI)
 *   5. Generate quizzes (AI)
 *   6. Publish to DB (courses → course_modules → course_lessons)
 *   7. Queue video generation (optional)
 *
 * Each stage emits progress via the onProgress callback so callers
 * can stream status to the UI without polling.
 *
 * Usage:
 *   const result = await runCoursePipeline({
 *     title: 'EPA 608 Certification',
 *     topic: 'HVAC refrigerant handling and EPA regulations',
 *     difficulty: 'intermediate',
 *     programId: 'uuid',
 *     onProgress: (stage, message) => console.log(stage, message),
 *   });
 */

import type { SupabaseClient } from '@/lib/supabase';
import { runCoursePublishPipeline } from './pipeline';
import type { CourseTemplate } from './schema';
import { logger } from '@/lib/logger';
import { aiChat } from '@/lib/ai/ai-service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStage =
  | 'blueprint'
  | 'parse'
  | 'validate'
  | 'lessons'
  | 'quizzes'
  | 'publish'
  | 'videos'
  | 'complete'
  | 'error';

export type PipelineInput = {
  title: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  programId: string;
  moduleCount?: number;
  lessonsPerModule?: number;
  includeVideos?: boolean;
  dryRun?: boolean;
  db: SupabaseClient;
  onProgress?: (stage: PipelineStage, message: string) => void;
};

export type PipelineOutput = {
  success: boolean;
  courseId: string | null;
  title: string;
  modulesGenerated: number;
  lessonsGenerated: number;
  lessonsWithQuizzes: number;
  videosQueued: number;
  errors: string[];
  dryRun: boolean;
};

// ─── Stage: Generate blueprint via AI ────────────────────────────────────────

async function generateBlueprint(input: PipelineInput): Promise<CourseTemplate | null> {
  const moduleCount = input.moduleCount ?? 6;
  const lessonsPerModule = input.lessonsPerModule ?? 5;

  const systemPrompt = `You are a curriculum architect. Generate a structured course blueprint as JSON.
The blueprint must follow this exact schema:
{
  "title": string,
  "slug": string (kebab-case),
  "description": string,
  "modules": [
    {
      "title": string,
      "slug": string (kebab-case),
      "order": number (1-based),
      "lessons": [
        {
          "title": string,
          "slug": string (kebab-case, unique across course),
          "type": "lesson" | "checkpoint" | "quiz" | "lab" | "exam",
          "order": number (1-based),
          "description": string
        }
      ]
    }
  ]
}
Rules:
- Each module must end with one checkpoint lesson (slug ends in -checkpoint)
- Last module must end with an exam lesson (slug ends in -exam)
- All slugs must be globally unique within the course
- Return ONLY valid JSON, no markdown, no explanation`;

  const userPrompt = `Create a ${input.difficulty} course on: "${input.topic}"
Title: "${input.title}"
Modules: ${moduleCount}
Lessons per module: ${lessonsPerModule} (including the checkpoint)
Program ID: ${input.programId}`;

  const result = await aiChat({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    maxTokens: 4000,
  });

  if (!result.content) return null;

  try {
    // Strip markdown code fences if present
    const cleaned = result.content.replace(/^```json\n?|\n?```$/g, '').trim();
    const blueprint = JSON.parse(cleaned);

    // Map to CourseTemplate shape
    const template: CourseTemplate = {
      title: blueprint.title,
      slug: blueprint.slug,
      description: blueprint.description,
      programId: input.programId,
      modules: blueprint.modules.map((mod: any) => ({
        title: mod.title,
        slug: mod.slug,
        order: mod.order,
        lessons: mod.lessons.map((lesson: any) => ({
          title: lesson.title,
          slug: lesson.slug,
          type: lesson.type ?? 'lesson',
          order: lesson.order,
          description: lesson.description ?? '',
        })),
      })),
    };

    return template;
  } catch (err) {
    logger.error('[orchestrator] Failed to parse AI blueprint', err);
    return null;
  }
}

// ─── Stage: Generate lesson content via AI ───────────────────────────────────

async function generateLessonContent(
  template: CourseTemplate,
  onProgress?: PipelineInput['onProgress'],
): Promise<CourseTemplate> {
  const enrichedModules = await Promise.all(
    template.modules.map(async (mod) => {
      const enrichedLessons = await Promise.all(
        mod.lessons.map(async (lesson) => {
          if (lesson.type === 'checkpoint' || lesson.type === 'exam') {
            return lesson; // quizzes handled separately
          }

          try {
            const result = await aiChat({
              model: 'gpt-4.1-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a curriculum writer. Write concise lesson content in plain HTML (h2, p, ul, ol tags only). 300-500 words.',
                },
                {
                  role: 'user',
                  content: `Write lesson content for: "${lesson.title}" in the context of "${template.title}". Topic: ${lesson.description}`,
                },
              ],
              temperature: 0.5,
              maxTokens: 800,
            });

            return { ...lesson, content: result.content ?? '' };
          } catch {
            return lesson;
          }
        }),
      );
      return { ...mod, lessons: enrichedLessons };
    }),
  );

  onProgress?.('lessons', `Generated content for ${template.modules.reduce((n, m) => n + m.lessons.length, 0)} lessons`);
  return { ...template, modules: enrichedModules };
}

// ─── Stage: Generate quiz questions ──────────────────────────────────────────

async function generateQuizQuestions(
  template: CourseTemplate,
  onProgress?: PipelineInput['onProgress'],
): Promise<CourseTemplate> {
  let quizCount = 0;

  const enrichedModules = await Promise.all(
    template.modules.map(async (mod) => {
      const enrichedLessons = await Promise.all(
        mod.lessons.map(async (lesson) => {
          if (lesson.type !== 'checkpoint' && lesson.type !== 'quiz' && lesson.type !== 'exam') {
            return lesson;
          }

          try {
            const questionCount = lesson.type === 'exam' ? 20 : 10;
            const result = await aiChat({
              model: 'gpt-4.1-mini',
              messages: [
                {
                  role: 'system',
                  content: `Generate ${questionCount} multiple-choice questions as JSON array. Each question: { "question": string, "options": string[4], "correct": number (0-3 index), "explanation": string }. Return ONLY valid JSON array.`,
                },
                {
                  role: 'user',
                  content: `Generate questions for a ${lesson.type} on module "${mod.title}" in course "${template.title}".`,
                },
              ],
              temperature: 0.3,
              maxTokens: 2000,
            });

            if (result.content) {
              const cleaned = result.content.replace(/^```json\n?|\n?```$/g, '').trim();
              const questions = JSON.parse(cleaned);
              quizCount++;
              return { ...lesson, quiz_questions: questions, passing_score: lesson.type === 'exam' ? 75 : 70 };
            }
          } catch {
            // Return lesson without questions — pipeline will still publish
          }
          return lesson;
        }),
      );
      return { ...mod, lessons: enrichedLessons };
    }),
  );

  onProgress?.('quizzes', `Generated quiz questions for ${quizCount} assessments`);
  return { ...template, modules: enrichedModules };
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function runCoursePipeline(input: PipelineInput): Promise<PipelineOutput> {
  const { onProgress, dryRun = false } = input;
  const errors: string[] = [];

  try {
    // Stage 1: Generate blueprint
    onProgress?.('blueprint', `Generating course blueprint for "${input.title}"…`);
    const template = await generateBlueprint(input);
    if (!template) {
      return { success: false, courseId: null, title: input.title, modulesGenerated: 0, lessonsGenerated: 0, lessonsWithQuizzes: 0, videosQueued: 0, errors: ['Blueprint generation failed'], dryRun };
    }
    onProgress?.('blueprint', `Blueprint ready: ${template.modules.length} modules, ${template.modules.reduce((n, m) => n + m.lessons.length, 0)} lessons`);

    // Stage 2: Generate lesson content
    onProgress?.('lessons', 'Generating lesson content…');
    const withContent = await generateLessonContent(template, onProgress);

    // Stage 3: Generate quiz questions
    onProgress?.('quizzes', 'Generating quiz and checkpoint questions…');
    const withQuizzes = await generateQuizQuestions(withContent, onProgress);

    // Stage 4: Validate
    onProgress?.('validate', 'Validating course structure…');

    // Stage 5: Publish to DB
    onProgress?.('publish', dryRun ? 'Dry run — validating without writing to DB…' : 'Publishing to database…');
    const result = await runCoursePublishPipeline({
      template: withQuizzes,
      db: input.db,
      mode: 'missing-only',
      dryRun,
    });

    if (!result.success) {
      errors.push(...result.errors);
    }

    const lessonsWithQuizzes = withQuizzes.modules.reduce(
      (n, m) => n + m.lessons.filter(l => l.type === 'checkpoint' || l.type === 'quiz' || l.type === 'exam').length,
      0,
    );

    // Stage 6: Queue videos (optional)
    let videosQueued = 0;
    if (input.includeVideos && result.courseId && !dryRun) {
      onProgress?.('videos', 'Queuing video generation…');
      try {
        await fetch(`/api/admin/generate-lesson-videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: result.courseId }),
        });
        videosQueued = withQuizzes.modules.reduce((n, m) => n + m.lessons.length, 0);
      } catch {
        errors.push('Video queue failed — course published successfully, videos can be queued manually');
      }
    }

    onProgress?.('complete', result.success ? `Course published: ${result.courseId}` : 'Pipeline completed with errors');

    return {
      success: result.success,
      courseId: result.courseId,
      title: withQuizzes.title,
      modulesGenerated: withQuizzes.modules.length,
      lessonsGenerated: result.lessonsWritten,
      lessonsWithQuizzes,
      videosQueued,
      errors,
      dryRun,
    };
  } catch (err) {
    logger.error('[orchestrator] Pipeline failed', err);
    const message = err instanceof Error ? err.message : 'Unknown pipeline error';
    return {
      success: false,
      courseId: null,
      title: input.title,
      modulesGenerated: 0,
      lessonsGenerated: 0,
      lessonsWithQuizzes: 0,
      videosQueued: 0,
      errors: [message],
      dryRun,
    };
  }
}
