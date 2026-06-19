/**
 * POST /api/admin/courses/generate/publish
 * Creates a new course from AI-generated content.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface QuizQuestion { question: string; options: string[]; correct_index: number; explanation: string; }
interface Lesson { lesson_number: number; title: string; description: string; content: string; duration_minutes: number; quiz_questions: QuizQuestion[]; }
interface Module { title: string; sort_order: number; lessons: Lesson[]; }
interface GeneratedCourse { title: string; subtitle: string; description: string; audience: string; duration_hours: number; category: string; passing_score: number; completion_rule: string; modules: Module[]; }

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { course, program_id, is_published = false } = body as { course: GeneratedCourse; program_id?: string; is_published?: boolean; };

    if (!course || !course.title) {
      return NextResponse.json({ error: 'Course data is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const slug = course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: course.title,
        slug: `${slug}-${Date.now()}`,
        description: course.description || course.subtitle,
        category: course.category || 'General',
        duration_hours: course.duration_hours || 1,
        passing_score: course.passing_score || 70,
        status: is_published ? 'published' : 'draft',
        program_id: program_id || null,
      })
      .select('id')
      .single();

    if (courseError || !courseData) {
      logger.error('Failed to create course', courseError);
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }

    const courseId = courseData.id;

    if (course.modules?.length > 0) {
      for (const mod of course.modules) {
        const { data: modRec, error: modErr } = await supabase.from('course_modules').insert({ course_id: courseId, title: mod.title, sort_order: mod.sort_order || 0 }).select('id').single();
        if (modErr || !modRec) continue;
        
        for (const lesson of mod.lessons || []) {
          await supabase.from('course_lessons').insert({ module_id: modRec.id, title: lesson.title, description: lesson.description, content: lesson.content, duration_minutes: lesson.duration_minutes || 30, lesson_number: lesson.lesson_number || 1 });
        }
      }
    }

    logger.info('Course created from AI builder', { courseId, title: course.title });
    return NextResponse.json({ success: true, courseId, title: course.title });

  } catch (err) {
    logger.error('Course generation failed', err);
    return NextResponse.json({ error: 'Failed to generate course', details: String(err) }, { status: 500 });
  }
}
