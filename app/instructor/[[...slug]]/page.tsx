import Link from 'next/link';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { InstructorIntakeForm } from '@/components/instructor/InstructorIntakeForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instructor Workspace | Elevate For Humanity',
  description: 'Course delivery, student progress, sign-off queue, and instructional tools.',
};

const TITLES: Record<string, string> = {
  home: 'Instructor Workspace',
  courses: 'Instructor Courses',
  students: 'Instructor Students',
  submissions: 'Sign-off Queue',
  settings: 'Instructor Settings',
  analytics: 'Teaching Analytics',
  classes: 'Class Management',
  assignments: 'Assignments',
  assessments: 'Assessment Tools',
  gradebook: 'Gradebook',
  certificates: 'Certificates',
  messages: 'Instructor Messages',
  documents: 'Instructor Documents',
  programs: 'Instructional Programs',
  campaigns: 'Instructor Campaigns',
};

const DESCRIPTIONS: Record<string, string> = {
  home: 'Manage instructional operations and learner support from one workspace.',
  courses: 'Review active course structure and teaching resources.',
  students: 'Monitor learner progress and classroom engagement.',
  submissions: 'Process practical sign-offs and assignment reviews.',
  settings: 'Maintain instructor profile and platform preferences.',
  analytics: 'Track instructional outcomes and completion trends.',
  classes: 'Coordinate class-level delivery and attendance workflows.',
  assignments: 'Create, review, and follow up on assignment activity.',
  assessments: 'Build quizzes and practical evaluation workflows.',
  gradebook: 'View learner scoring and completion milestones.',
  certificates: 'Review completion status tied to certificate issuance.',
  messages: 'Coordinate communication with learners and teams.',
  documents: 'Access instructor onboarding and compliance documents.',
  programs: 'View program taxonomy and instructional pathways.',
  campaigns: 'Coordinate outreach and instructional communications.',
};

export default async function InstructorWorkspacePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  await requireRole(['instructor', 'admin', 'super_admin', 'staff']);
  const { slug = [] } = await params;
  const section = slug[0] || 'home';
  const subSection = slug[1] || null;

  const title = TITLES[section] || 'Instructor Workspace';
  const description = DESCRIPTIONS[section] || DESCRIPTIONS.home;

  const supabase = await createClient();

  const [coursesQ, studentsQ, submissionsQ] = await Promise.all([
    supabase.from('training_courses').select('*', { head: true, count: 'exact' }),
    supabase.from('profiles').select('*', { head: true, count: 'exact' }).eq('role', 'student'),
    supabase
      .from('step_submissions')
      .select('*', { head: true, count: 'exact' })
      .in('status', ['submitted', 'pending_review']),
  ]);

  const coursesCount = coursesQ.count || 0;
  const studentsCount = studentsQ.count || 0;
  const submissionsCount = submissionsQ.count || 0;

  const showStudentNew = section === 'students' && subSection === 'new';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">
            Instructor Portal
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-slate-600 mt-2">{description}</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Metric label="Courses" value={coursesCount} />
          <Metric label="Students" value={studentsCount} />
          <Metric label="Pending Sign-offs" value={submissionsCount} />
        </section>

        {showStudentNew ? (
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add Student to Intake</h2>
                <p className="text-slate-600 text-sm mt-1">
                  Collect onboarding details to enroll students into programs and track their progress.
                </p>
              </div>
              <Link
                href="/instructor/students"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Back
              </Link>
            </div>
            <InstructorIntakeForm />
          </section>
        ) : (
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Action href="/instructor/courses" label="My Courses" />
              <Action href="/instructor/students" label="Students" />
              <Action href="/instructor/submissions" label="Sign-off Queue" />
              <Action href="/instructor/analytics" label="Analytics" />
              <Action href="/instructor/assignments" label="Assignments" />
              <Action href="/instructor/messages" label="Messages" />
              <Action href="/instructor/assessments" label="Assessments" />
              <Action href="/instructor/gradebook" label="Gradebook" />
              <Action href="/instructor/settings" label="Settings" />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Section Context</h3>
              <p className="text-sm text-slate-700">
                You are viewing <strong>{`/${section}${subSection ? `/${subSection}` : ''}`}</strong>. This route
                is fully available inside the instructor workspace and can be linked from onboarding,
                dashboards, and product demos without broken navigation.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function Action({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 font-medium text-slate-900">
      {label}
    </Link>
  );
}
