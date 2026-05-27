import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Layers, Wand2, ArrowRight, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Studio | Elevate Admin',
  robots: { index: false, follow: false },
};

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  published: boolean | null;
  updated_at: string | null;
}

async function getCourses(): Promise<Course[]> {
  const db = await requireAdminClient();
  const { data } = await db
    .from('courses')
    .select('id, title, slug, status, published, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-slate-100 text-slate-600',
  generating: 'bg-amber-100 text-amber-700',
  archived: 'bg-red-100 text-red-600',
};

function statusLabel(course: Course): string {
  if (course.status) return course.status;
  return course.published ? 'published' : 'draft';
}

export default async function StudioIndexPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-blue-600 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Course Studio</h1>
              <p className="text-xs text-slate-500">Select a course to open the studio</p>
            </div>
          </div>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue-600 text-white text-sm font-medium hover:bg-brand-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Course
          </Link>
        </div>
      </div>

      {/* Course grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {courses.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No courses found. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const label = statusLabel(course);
              const badgeClass = STATUS_STYLES[label] ?? 'bg-slate-100 text-slate-600';
              const updated = course.updated_at
                ? new Date(course.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : null;

              return (
                <Link
                  key={course.id}
                  href={`/admin/studio/${course.id}`}
                  className="group flex flex-col bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-brand-blue-600" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badgeClass}`}>
                      {label}
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">
                    {course.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono truncate mb-4">{course.slug}</p>

                  <div className="mt-auto flex items-center justify-between">
                    {updated && (
                      <span className="text-xs text-slate-400">Updated {updated}</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors ml-auto" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
