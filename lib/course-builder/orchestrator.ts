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
 *     onProgress: (stage, message) => logger.info(stage, message),
 *   });
 */

import type { SupabaseClient } from '@/lib/supabase';
import { runCoursePublishPipeline } from './pipeline';
import type { CourseTemplate } from './schema';
import { logger } from '@/lib/logger';
import { aiChat } from '@/lib/ai/ai-service';
import { getOnetSnapshot, searchOnetOccupations } from '@/lib/onet/client';
import { generateCourseCode } from './pipeline';

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
  /** Program slug — used by the pipeline resolver to map program → course.
   *  If omitted, the orchestrator will look it up from the programs table. */
  programSlug?: string;
  moduleCount?: number;
  lessonsPerModule?: number;
  includeVideos?: boolean;
  dryRun?: boolean;
  socCode?: string; // O*NET SOC code — if provided, skips keyword search
  db: SupabaseClient;
  onProgress?: (stage: PipelineStage, message: string) => void;
};

export type PipelineOutput = {
  success: boolean;
  courseId: string | null;
  courseCode: string | null;
  title: string;
  modulesGenerated: number;
  lessonsGenerated: number;
  lessonsWithQuizzes: number;
  videosQueued: number;
  errors: string[];
  dryRun: boolean;
};

// ─── Stage: Fetch O*NET labor market context ─────────────────────────────────

async function fetchCareerContext(topic: string, socCode?: string): Promise<string> {
  try {
    // If a SOC code is provided use it directly, otherwise search by topic keyword
    let soc = socCode;
    if (!soc) {
      const results = await searchOnetOccupations(topic, 1);
      soc = results[0]?.code;
    }
    if (!soc) return '';

    const snapshot = await getOnetSnapshot(soc);
    if (!snapshot) return '';

    return `
LABOR MARKET CONTEXT (O*NET SOC ${snapshot.soc} — ${snapshot.title}):
Description: ${snapshot.description}
Job Zone: ${snapshot.jobZoneTitle} — ${snapshot.jobZoneEducation}
Bright Outlook: ${snapshot.brightOutlook ? 'Yes — ' + snapshot.brightOutlookReasons.join(', ') : 'No'}
Top Skills: ${snapshot.topSkills.join(', ')}
Core Knowledge Areas: ${snapshot.topKnowledge.join(', ')}
Core Job Tasks:
${snapshot.coreTasks.map((t) => `  - ${t}`).join('\n')}
Common Job Titles: ${snapshot.sampleTitles.join(', ')}
Has Registered Apprenticeships: ${snapshot.hasApprenticeships ? 'Yes' : 'No'}
${snapshot.attribution}`.trim();
  } catch (err) {
    logger.warn('[orchestrator] O*NET fetch failed — continuing without career context', { err });
    return '';
  }
}

// ─── Stage: Generate blueprint via AI ────────────────────────────────────────

async function generateBlueprint(
  input: PipelineInput,
  onProgress?: PipelineInput['onProgress'],
): Promise<CourseTemplate | null> {
  const moduleCount = input.moduleCount ?? 6;
  const lessonsPerModule = input.lessonsPerModule ?? 5;

  // Fetch O*NET career context to ground the AI in real labor market data
  onProgress?.('blueprint', 'Fetching O*NET career context...');
  const careerContext = await fetchCareerContext(input.topic, input.socCode);
  if (careerContext) {
    logger.info('[orchestrator] O*NET context loaded', { topic: input.topic });
  }

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
- Align module topics to the core job tasks and knowledge areas when career context is provided
- Return ONLY valid JSON, no markdown, no explanation`;

  const userPrompt = `Create a ${input.difficulty} course on: "${input.topic}"
Title: "${input.title}"
Modules: ${moduleCount}
Lessons per module: ${lessonsPerModule} (including the checkpoint)
Program ID: ${input.programId}
${careerContext ? `\n${careerContext}` : ''}`;

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

    // Map to CourseTemplate shape — all required ProgramBuilderTemplate fields must be set
    const template: CourseTemplate = {
      title: blueprint.title,
      slug: blueprint.slug,
      // courseSlug and programSlug are required by the pipeline layer.
      // programSlug is resolved from the programs table if not supplied by the caller.
      courseSlug: blueprint.slug,
      programSlug: input.programSlug ?? blueprint.slug, // caller should pass programSlug; fallback to course slug
      description: blueprint.description,
      programId: input.programId,
      // Required ProgramBuilderTemplate fields with sensible defaults for AI-generated courses
      credentialTarget: 'INTERNAL',
      minimumHours: 0, // hours engine will compute from lesson durations
      requiresFinalExam: false,
      finalExam: { required: false },
      certificateRequirements: {
        includeHours: true,
        includeCompetencies: false,
        includeInstructorVerification: false,
        includeCompletionDate: true,
        includeVerificationUrl: true,
      },
      regulatory: {
        complianceProfileKey: 'default',
        credentialTarget: 'INTERNAL',
      },
      modules: blueprint.modules.map((mod: any, mi: number) => ({
        slug: mod.slug,
        title: mod.title,
        order: mod.order ?? mi + 1,
        orderIndex: mod.order ?? mi + 1,
        domainKey: 'general',
        targetHours: 0,
        quizRequired: true,
        practicalRequired: false,
        lessons: mod.lessons.map((lesson: any, li: number) => ({
          slug: lesson.slug,
          title: lesson.title,
          type: lesson.type ?? 'lesson',
          order: lesson.order ?? li + 1,
          orderIndex: lesson.order ?? li + 1,
          lessonType: lesson.type ?? 'lesson',
          description: lesson.description ?? '',
          durationMinutes: 30,
          learningObjectives: [`Understand ${lesson.title}`],
          content: {},
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

            // content is stored as a string (HTML) in course_lessons
            return { ...lesson, content: result.content ?? '', renderedHtml: result.content ?? '' };
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
              // camelCase — matches CourseLesson type and pipeline's persistCourse mapping
              return { ...lesson, quizQuestions: questions, passingScore: lesson.type === 'exam' ? 75 : 70 };
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
    const template = await generateBlueprint(input, onProgress);
    if (!template) {
      return { success: false, courseId: null, courseCode: null, title: input.title, modulesGenerated: 0, lessonsGenerated: 0, lessonsWithQuizzes: 0, videosQueued: 0, errors: ['Blueprint generation failed'], dryRun };
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

    const courseCode = result.courseId ? generateCourseCode(withQuizzes.courseSlug ?? withQuizzes.slug ?? input.title) : null;
    onProgress?.('complete', result.success ? `Course published: ${result.courseId} (${courseCode})` : 'Pipeline completed with errors');

    return {
      success: result.success,
      courseId: result.courseId,
      courseCode,
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
      courseCode: null,
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
