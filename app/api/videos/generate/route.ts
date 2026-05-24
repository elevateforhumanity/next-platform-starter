/**
 * POST /api/videos/generate
 *
 * Accepts a lesson_id from the admin course builder, creates a video_jobs row,
 * then fires the render pipeline asynchronously (non-blocking response).
 *
 * The render runs in the background on the ECS task which has
 * ffmpeg, chromium, and Remotion's native binaries available.
 *
 * Flow:
 *   Admin POST lesson_id
 *   → create video_jobs row (status: queued)
 *   → return job_id immediately
 *   → background: render MP4 → upload to Supabase Storage
 *   → markComplete() updates video_jobs + course_lessons
 *
 * Admin polls GET /api/videos/status/:job_id until status = 'complete'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { createJob, markRendering, markComplete, markFailed } from '@/lib/video/job-queue';
import { renderLessonVideo, inferDomainKey } from '@/lib/video/remotion-render';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 600;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let lessonId: string;
  try {
    const body = await request.json();
    lessonId = body.lesson_id;
    if (!lessonId) return safeError('lesson_id is required', 400);
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const supabase = await createClient();
  const adminDb = await requireAdminClient();
  if (!adminDb) return safeError('Service unavailable', 503);

  // Fetch lesson + course
  const { data: lesson, error: lessonErr } = await supabase
    .from('course_lessons')
    .select('id, title, script, bullet_points, duration_seconds, course_id, video_status')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonErr || !lesson) return safeError('Lesson not found', 404);
  if (lesson.video_status === 'rendering') return safeError('Video is already rendering', 409);

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', lesson.course_id)
    .maybeSingle();

  // Create job — returns immediately with job_id
  const job = await createJob({
    lesson_id: lessonId,
    course_id: lesson.course_id,
    lesson_title: lesson.title,
    script: lesson.script ?? undefined,
    bullet_points: Array.isArray(lesson.bullet_points) ? lesson.bullet_points : [],
  });

  // Fire render in background — do not await
  runRender({
    jobId: job.id,
    lessonId,
    courseId: lesson.course_id,
    lessonTitle: lesson.title,
    courseTitle: course?.title ?? 'Elevate LMS',
    script: lesson.script ?? lesson.title,
    bulletPoints: Array.isArray(lesson.bullet_points) ? lesson.bullet_points : [],
    durationSecs: lesson.duration_seconds ?? undefined,
    adminDb,
  }).catch((err) => {
    // audit-safe: err goes to logger only, not HTTP response
    logger.error('[VideoGenerate] Background render threw', err);
  });

  return NextResponse.json(
    {
      success: true,
      job_id: job.id,
      status: 'queued',
      message: 'Video render queued. Poll /api/videos/status/' + job.id + ' for progress.',
    },
    { status: 202 },
  );
}

// ── Background render ─────────────────────────────────────────────────────────

async function runRender(opts: {
  jobId: string;
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
  script: string;
  bulletPoints: string[];
  durationSecs?: number;
  adminDb: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>;
}) {
  const { jobId, lessonId, courseTitle, lessonTitle, script, bulletPoints, adminDb } = opts;

  await markRendering(jobId);

  try {
    const domainKey = inferDomainKey(courseTitle, lessonTitle);

    const result = await renderLessonVideo({
      lessonId,
      title: lessonTitle,
      moduleTitle: courseTitle,
      objective: lessonTitle,
      keyPoints: bulletPoints.length
        ? bulletPoints
        : script.split(/\.\s+/).filter(Boolean).slice(0, 5),
      example: script.substring(0, 300),
      summary: script.substring(0, 150),
      quizTeaser: 'Complete the knowledge check to continue.',
      domainKey,
      courseName: courseTitle,
    });

    if (!result.success || !result.videoUrl) {
      await markFailed(jobId, result.error ?? 'Render returned no video URL');
      return;
    }

    // Upload MP4 from public/generated to Supabase Storage
    const localPath = path.join(process.cwd(), 'public', result.videoUrl);
    let storageUrl = result.videoUrl; // fallback to local public path

    try {
      const buffer = await readFile(localPath);
      const storagePath = `lessons/${lessonId}/lesson-video.mp4`;

      const { error: uploadErr } = await adminDb.storage
        .from('course-videos')
        .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true });

      if (!uploadErr) {
        const { data: urlData } = adminDb.storage.from('course-videos').getPublicUrl(storagePath);
        storageUrl = urlData.publicUrl;
        // Clean up local file after successful upload
        await unlink(localPath).catch(() => {});
      } else {
        logger.warn(
          '[VideoGenerate] Storage upload failed, keeping local URL: ' + uploadErr.message,
        );
      }
    } catch (readErr) {
      logger.warn(
        '[VideoGenerate] Could not read local MP4 for upload: ' +
          (readErr instanceof Error ? readErr.message : readErr),
      );
    }

    await markComplete(jobId, {
      video_url: storageUrl,
      audio_url: result.audioUrl ?? undefined,
      duration_seconds: result.duration,
      scene_count: undefined,
    });
  } catch (err) {
    // audit-safe: message stored in DB job record only, not HTTP response
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(jobId, msg);
  }
}
