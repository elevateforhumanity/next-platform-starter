/**
 * POST /api/admin/course-builder/quick-add
 *
 * Lightweight endpoint for the LiveCourseBuilder sidebar.
 * Creates a module or lesson with minimal required fields.
 *
 * Body (module):  { type: 'module', courseId, title }
 * Body (lesson):  { type: 'lesson', courseId, moduleId, title, stepType? }
 *
 * Returns the created row so the UI can update state immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) +
    '-' +
    Date.now().toString(36)
  );
}

const ModuleSchema = z.object({
  type: z.literal('module'),
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
});

const LessonSchema = z.object({
  type: z.literal('lesson'),
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(200),
  stepType: z
    .enum(['lesson', 'quiz', 'checkpoint', 'lab', 'assignment', 'exam', 'certification'])
    .default('lesson'),
});

const BodySchema = z.discriminatedUnion('type', [ModuleSchema, LessonSchema]);

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid input', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);
  const body = parsed.data;

  if (body.type === 'module') {
    // Get current max module_order for this course
    const { data: existing } = await db
      .from('course_modules')
      .select('module_order')
      .eq('course_id', body.courseId)
      .order('module_order', { ascending: false })
      .limit(1);

    const nextOrder = ((existing?.[0]?.module_order ?? 0) as number) + 1;

    const { data, error } = await db
      .from('course_modules')
      .insert({
        course_id: body.courseId,
        title: body.title,
        slug: slugify(body.title),
        module_order: nextOrder,
      })
      .select('id, title, slug, module_order')
      .single();

    if (error) return safeInternalError(error, 'Failed to create module');
    return NextResponse.json({ ok: true, module: data });
  }

  // Lesson
  const { data: existing } = await db
    .from('course_lessons')
    .select('lesson_order')
    .eq('module_id', body.moduleId)
    .order('lesson_order', { ascending: false })
    .limit(1);

  const nextOrder = ((existing?.[0]?.lesson_order ?? 0) as number) + 1;

  const { data, error } = await db
    .from('course_lessons')
    .insert({
      course_id: body.courseId,
      module_id: body.moduleId,
      title: body.title,
      slug: slugify(body.title),
      lesson_order: nextOrder,
      lesson_type: body.stepType,
      status: 'draft',
      content: '',
    })
    .select(
      'id, title, slug, lesson_order, lesson_type, content, video_url, duration_minutes, passing_score, status',
    )
    .single();

  if (error) return safeInternalError(error, 'Failed to create lesson');

  return NextResponse.json({
    ok: true,
    lesson: {
      id: data.id,
      title: data.title,
      slug: data.slug,
      lesson_order: data.lesson_order,
      step_type: data.lesson_type ?? 'lesson',
      content: data.content ?? '',
      video_url: data.video_url ?? '',
      duration_minutes: data.duration_minutes,
      passing_score: data.passing_score,
      status: data.status ?? 'draft',
    },
  });
}
