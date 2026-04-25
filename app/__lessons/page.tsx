import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import { BookOpen, Clock, Award, ArrowRight, Lock } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Lessons & Course Catalog | Elevate for Humanity',
  description: 'Browse career training lessons and courses at Elevate for Humanity. Enroll in WIOA-funded programs in healthcare, trades, technology, and business.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/lessons' },
};

export default async function LessonsPage() {
  const db = await getAdminClient();

  // Published courses with lesson counts
  const { data: courses } = await db
    .from('courses')
    .select(`
      id, title, description, short_description, status, is_active,
      program_id,
      course_modules(id, title, module_order,
        course_lessons(id, title, lesson_type, lesson_order)
      )
    `)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12);

  // Published programs for context
  const { data: programs } = await db
    .from('programs')
    .select('id, title, slug, short_description, credential_type')
    .eq('published', true)
    .eq('is_active', true)
    .order('title')
    .limit(8);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Lessons &amp; Courses' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Career Training</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Lessons &amp; Course Catalog</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-6">
            Browse available training courses. Most programs are available at no cost through WIOA, WRG, or FSSA funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/apply" className="inline-flex items-center justify-center rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition">
              Apply for Funded Training
            </Link>
            <Link href="/eligibility" className="inline-flex items-center justify-center rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition">
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      {courses && courses.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Available Courses</h2>
              <Link href="/lms/courses" className="text-sm font-semibold text-brand-red-600 hover:underline flex items-center gap-1">
                My enrolled courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => {
                const moduleCount = course.course_modules?.length ?? 0;
                const lessonCount = course.course_modules?.reduce(
                  (sum: number, m: any) => sum + (m.course_lessons?.length ?? 0), 0
                ) ?? 0;
                return (
                  <div key={course.id} className="rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                    <div className="bg-slate-100 h-36 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-slate-300" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 mb-1 leading-snug">{course.title}</h3>
                      {course.short_description && (
                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{course.short_description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {lessonCount} lessons</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {moduleCount} modules</span>
                      </div>
                      <Link
                        href={`/lms/courses/${course.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-red-600 hover:underline"
                      >
                        View course <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Programs */}
      {programs && programs.length > 0 && (
        <section className="py-14 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Training Programs</h2>
              <Link href="/programs" className="text-sm font-semibold text-brand-red-600 hover:underline flex items-center gap-1">
                All programs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {programs.map((p) => (
                <Link
                  key={p.id}
                  href={`/programs/${p.slug}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <Award className="w-6 h-6 text-brand-red-500 mb-3" />
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.credential_type ?? 'Certificate'}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LMS login CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <Lock className="w-8 h-8 text-brand-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Access Your Enrolled Lessons</h2>
          <p className="text-slate-300 mb-8">
            Already enrolled? Sign in to access your course materials, track progress, and complete lessons.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login?redirect=/lms/courses" className="rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition">
              Sign In to LMS
            </Link>
            <Link href="/signup" className="rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
