import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import LiveCourseBuilder from '@/components/admin/course-builder/LiveCourseBuilder';

export const dynamic = 'force-dynamic';

export default async function LiveCourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);

  const { courseId } = await params;
  const db = await requireAdminClient();

  // Load course
  const { data: course } = await db
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle();

  if (!course) notFound();

  // Load modules with lessons
  const { data: modulesRaw } = await db
    .from('course_modules')
    .select(
      `
      id, title, slug, order_index,
      course_lessons (
        id, title, slug, order_index, lesson_type, content,
        video_url, duration_minutes, passing_score, status
      )
    `,
    )
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const modules = (modulesRaw ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
    module_order: m.order_index,
    lessons: (m.course_lessons ?? [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((l: any) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        lesson_order: l.order_index,
        step_type: l.lesson_type ?? 'lesson',
        content: l.content ?? '',
        video_url: l.video_url ?? '',
        duration_minutes: l.duration_minutes,
        passing_score: l.passing_score,
        status: l.status ?? 'draft',
      })),
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  return (
    <LiveCourseBuilder
      courseId={courseId}
      courseTitle={course.title}
      initialModules={modules}
      lmsBaseUrl={siteUrl}
    />
  );
}
