/**
 * POST /api/admin/course-builder/generate-from-blueprint
 *
 * Full automated course generation pipeline — one call, full premium course.
 *
 * Pipeline:
 *   1. Load blueprint from registry
 *   2. GPT-4o generates objective + content + quiz questions for every lesson
 *   3. Inject generated content into blueprint lesson refs
 *   4. buildCanonicalCourseFromBlueprint() → course_modules + course_lessons
 *   5. assessment-generator → quiz banks per module + final exam
 *   6. Trigger /api/admin/generate-lesson-videos → Synthesia → D-ID → TTS
 *   7. Return { courseId, modules, lessons, videosQueued }
 *
 * Auth: admin only
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAllBlueprints } from '@/lib/curriculum/blueprints';
import { buildCanonicalCourseFromBlueprint } from '@/lib/curriculum/builders/buildCanonicalCourseFromBlueprint';
import {
  generateAndPersistModuleQuiz,
  generateAndPersistFinalExam,
} from '@/lib/course-builder/assessment-generator';
import { groqJSON } from '@/lib/groq-client';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import type { BlueprintLessonRef } from '@/lib/curriculum/blueprints/types';
import {
  generateNaturalVoiceover,
  generateDIDVideo,
  generateSynthesiaVideo,
} from '@/lib/video/generate';
import { getInstructorForCourse } from '@/lib/ai-instructors';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateFromBlueprintRequest {
  blueprintId: string;
  programId: string;
  mode?: 'replace' | 'missing-only';
}

interface LessonContent {
  objective: string;
  content: string;
  quiz_questions: Array<{
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>;
}

// ─── Groq lesson content generator ───────────────────────────────────────────

async function generateLessonContent(
  lesson: BlueprintLessonRef,
  moduleTitle: string,
  courseTitle: string,
  state: string,
): Promise<LessonContent> {
  const isCheckpoint = lesson.slug.includes('checkpoint');
  const isExam = lesson.slug.includes('exam') || lesson.slug.includes('final');
  const questionCount = isExam ? 10 : isCheckpoint ? 5 : 3;

  const prompt = `You are a curriculum architect writing premium workforce training content.

Course: ${courseTitle} (${state})
Module: ${moduleTitle}
Lesson: ${lesson.title}
Type: ${isExam ? 'final exam' : isCheckpoint ? 'checkpoint quiz' : 'lesson'}

Return ONLY valid JSON — no markdown, no prose:
{
  "objective": "By the end of this lesson, learners will be able to... (one sentence, 20-80 words)",
  "content": "<h2>...</h2><p>...</p>... (full HTML, minimum 400 words, use h2/p/ul/li, cover core concepts, real-world application, key terminology, practical guidance)",
  "quiz_questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "explanation": "..."
    }
  ]
}

Rules:
- objective: starts with "By the end of this lesson, learners will be able to"
- content: minimum 400 words, professional HTML, no placeholders
- quiz_questions: exactly ${questionCount} questions, correct is 0-indexed
- All content must be specific to ${courseTitle} — no generic filler`;

  return groqJSON<LessonContent>(prompt);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if ('error' in auth && auth.error) return auth.error;

  let body: GenerateFromBlueprintRequest;
  try {
    body = await req.json();
  } catch {
    return safeError('Request body must be valid JSON', 400);
  }

  if (!body?.blueprintId) return safeError('blueprintId is required', 400);
  if (!body?.programId) return safeError('programId is required', 400);

  const mode = body.mode ?? 'replace';

  // ── Step 1: Load blueprint ─────────────────────────────────────────────────
  const registry = await getAllBlueprints();
  const blueprint = registry.find((b) => b.id === body.blueprintId);
  if (!blueprint) return safeError(`Blueprint "${body.blueprintId}" not found`, 404);

  const courseTitle = blueprint.credentialTitle;
  const state = blueprint.state ?? 'Indiana';

  // ── Step 2: Generate content for every lesson via GPT-4o ──────────────────
  const enrichedBlueprint = { ...blueprint, modules: blueprint.modules.map((m) => ({ ...m })) };
  const generationLog: { slug: string; ok: boolean; error?: string }[] = [];

  for (const mod of enrichedBlueprint.modules) {
    const enrichedLessons: BlueprintLessonRef[] = [];

    for (const lesson of mod.lessons ?? []) {
      // Skip if content already exists (missing-only mode)
      if (mode === 'missing-only' && lesson.content && lesson.objective) {
        enrichedLessons.push(lesson);
        generationLog.push({ slug: lesson.slug, ok: true });
        continue;
      }

      try {
        const generated = await generateLessonContent(lesson, mod.title, courseTitle, state);

        enrichedLessons.push({
          ...lesson,
          objective: generated.objective,
          content: generated.content,
          quizQuestions: generated.quiz_questions.map((q) => ({
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
          })),
        });

        generationLog.push({ slug: lesson.slug, ok: true });
      } catch (err) {
        generationLog.push({
          slug: lesson.slug,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
        // Push lesson without content — seeder will skip it and report failure
        enrichedLessons.push(lesson);
      }

      // Throttle to avoid rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    mod.lessons = enrichedLessons;
  }

  const generationFailures = generationLog.filter((l) => !l.ok);

  // ── Step 3: Seed course from enriched blueprint ────────────────────────────
  const seedResult = await buildCanonicalCourseFromBlueprint({
    blueprint: enrichedBlueprint,
    programId: body.programId,
    mode,
  });

  if (!seedResult.courseId) {
    return safeInternalError(null, 'Course seeder did not return a courseId');
  }

  const courseId = seedResult.courseId;

  // ── Step 4: Generate assessment banks per lesson ───────────────────────────
  const db = await requireAdminClient();
  let assessmentsGenerated = 0;

  try {
    // Fetch all inserted lessons for this course
    const { data: lessons } = await db
      .from('course_lessons')
      .select('id, slug, lesson_type, module_id')
      .eq('course_id', courseId);

    for (const lesson of lessons ?? []) {
      if (lesson.lesson_type === 'exam') {
        const result = await generateAndPersistFinalExam(db, {
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          courseTitle,
          questionCount: 25,
          passingScore: 80,
        });
        assessmentsGenerated += result.writtenToDb;
      } else if (['checkpoint', 'quiz'].includes(lesson.lesson_type)) {
        const result = await generateAndPersistModuleQuiz(db, {
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          moduleTitle:
            enrichedBlueprint.modules.find((m) => m.lessons?.some((l) => l.slug === lesson.slug))
              ?.title ?? courseTitle,
          questionCount: 8,
          passingScore: 70,
        });
        assessmentsGenerated += result.writtenToDb;
      }
    }
  } catch (err) {
    // Non-fatal — course is live, assessments can be regenerated from /admin/course-builder
    logger.error('[generate-from-blueprint] assessment-generator error:', err);
  }

  // ── Step 5: Generate videos directly (no HTTP hop, no cookie dependency) ──
  let videosQueued = 0;
  try {
    const { data: lessonRows } = await db
      .from('course_lessons')
      .select('id, title, content, lesson_type')
      .eq('course_id', courseId)
      .is('video_url', null)
      .limit(10);

    const instructor = getInstructorForCourse(courseTitle);
    const VOICE_MAP: Record<string, string> = {
      'dr-sarah-chen': 'nova',
      'marcus-johnson': 'onyx',
      'james-williams': 'echo',
      'lisa-martinez': 'shimmer',
      'robert-davis': 'fable',
      'angela-thompson': 'alloy',
    };
    const voice = VOICE_MAP[instructor.id] ?? 'nova';

    for (const lesson of lessonRows ?? []) {
      const script =
        `Welcome to ${courseTitle}, lesson: ${lesson.title}. ${(lesson.content ?? '').replace(/<[^>]+>/g, '').substring(0, 300)}`.trim();
      let videoUrl: string | null = null;

      // Synthesia first
      if (process.env.SYNTHESIA_API_KEY && !videoUrl) {
        try {
          const r = await generateSynthesiaVideo(script, 'anna_costume1_cameraA');
          videoUrl = r.videoUrl;
        } catch {
          /* fall through */
        }
      }

      // D-ID second
      if (process.env.DID_API_KEY && !videoUrl) {
        try {
          const { audioBuffer } = await generateNaturalVoiceover(script, voice, instructor.id);
          const audioDataUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
          const r = await generateDIDVideo(script, instructor.avatar, audioDataUrl);
          videoUrl = r.videoUrl;
        } catch {
          /* fall through */
        }
      }

      // TTS audio fallback
      if (!videoUrl && process.env.OPENAI_API_KEY) {
        try {
          const { audioBuffer } = await generateNaturalVoiceover(script, voice, instructor.id);
          const path = `course-videos/${courseId}/${lesson.id}.mp3`;
          await db.storage
            .from('course-videos')
            .upload(path, audioBuffer, { contentType: 'audio/mp3', upsert: true });
          const { data: urlData } = db.storage.from('course-videos').getPublicUrl(path);
          videoUrl = urlData.publicUrl;
        } catch {
          /* non-fatal */
        }
      }

      if (videoUrl) {
        await db.from('course_lessons').update({ video_url: videoUrl }).eq('id', lesson.id);
        videosQueued++;
      }
    }
  } catch (err) {
    logger.error('[generate-from-blueprint] video generation error:', err);
  }

  // ── Step 6: Audit log ─────────────────────────────────────────────────────
  await logAdminAudit({
    action: AdminAction.BULK_CONTENT_GENERATED,
    actorId: auth.id ?? '00000000-0000-0000-0000-000000000000',
    entityType: 'courses',
    entityId: courseId,
    metadata: {
      blueprintId: body.blueprintId,
      programId: body.programId,
      mode,
      lessonsInserted: seedResult.lessonCount,
      contentFailures: seedResult.contentFailures?.length ?? 0,
      generationFailures: generationFailures.length,
      assessmentsGenerated,
      videosQueued,
    },
    req,
  });

  return NextResponse.json({
    ok: true,
    courseId,
    blueprintId: body.blueprintId,
    title: courseTitle,
    modules: enrichedBlueprint.modules.length,
    lessonsInserted: seedResult.lessonCount,
    contentFailures: seedResult.contentFailures ?? [],
    generationFailures,
    assessmentsGenerated,
    videosQueued,
    videoStudioUrl: `/admin/video-generator?courseId=${courseId}`,
    courseUrl: `/admin/courses/${courseId}`,
  });
}
