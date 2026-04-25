import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import AiTutorClient, { type LessonContext } from './AiTutorClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Tutor | Elevate LMS',
  description: 'Your 24/7 AI learning assistant. Get help with coursework, exam prep, and study questions.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/ai-tutor' },
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ courseId?: string; lessonId?: string }>;
}

async function fetchLessonContext(
  courseId: string,
  lessonId: string,
): Promise<LessonContext | null> {
  try {
    const db = await getAdminClient();

    // lms_lessons view covers both curriculum_lessons and course_lessons
    const { data: lesson } = await db
      .from('lms_lessons')
      .select('id, title, content, step_type, module_title, course_id')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!lesson) return null;

    const { data: course } = await db
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle();

    return {
      courseId,
      lessonId,
      courseTitle: course?.title ?? 'Your Course',
      lessonTitle: lesson.title ?? 'Current Lesson',
      moduleTitle: (lesson as any).module_title ?? '',
      stepType: lesson.step_type ?? 'lesson',
      // 1200 chars — enough context without blowing the token budget
      contentSnippet: ((lesson as any).content ?? '').slice(0, 1200),
    };
  } catch {
    return null;
  }
}

export default async function AiTutorPage({ searchParams }: PageProps) {
  const { courseId, lessonId } = await searchParams;

  const lessonContext =
    courseId && lessonId
      ? await fetchLessonContext(courseId, lessonId)
      : null;

  return <AiTutorClient lessonContext={lessonContext} />;
}
