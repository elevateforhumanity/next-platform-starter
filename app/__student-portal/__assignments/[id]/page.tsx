import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, Clock, AlertCircle, FileText, Calendar, Award } from 'lucide-react';
import SubmitAssignmentForm from './SubmitAssignmentForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: 'Assignment | Student Portal' };
}

export default async function StudentAssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/student-portal/assignments/' + id);

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, description, instructions, due_date, max_points, allow_late_submission, late_penalty_percent, submission_type, max_file_size_mb, allowed_file_types, lesson_id, course_id')
    .eq('id', id)
    .maybeSingle();

  if (!assignment) notFound();

  // Look up existing submission — by lesson_id if linked, otherwise by assignment_id
  let submissionQuery = supabase
    .from('step_submissions')
    .select('id, submission_text, file_urls, status, instructor_note, reviewed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (assignment.lesson_id) {
    submissionQuery = submissionQuery.eq('lesson_id', assignment.lesson_id);
  } else {
    submissionQuery = submissionQuery.eq('assignment_id', id);
  }

  const { data: submission } = await submissionQuery.maybeSingle();

  let courseName: string | null = null;
  if (assignment.course_id) {
    const { data: course } = await supabase
      .from('training_courses')
      .select('course_name')
      .eq('id', assignment.course_id)
      .maybeSingle();
    courseName = course?.course_name ?? null;
  }

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !submission;
  const isLate = assignment.due_date && submission && new Date(submission.created_at) > new Date(assignment.due_date);

  const statusConfig = submission
    ? submission.status === 'approved'
      ? { label: 'Approved', color: 'bg-brand-green-100 text-brand-green-700', icon: CheckCircle }
      : submission.status === 'rejected'
      ? { label: 'Revision Requested', color: 'bg-red-100 text-red-700', icon: AlertCircle }
      : submission.status === 'under_review'
      ? { label: 'Under Review', color: 'bg-brand-blue-100 text-brand-blue-700', icon: Clock }
      : { label: 'Submitted', color: 'bg-brand-blue-100 text-brand-blue-700', icon: CheckCircle }
    : isOverdue
    ? { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    : { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        <Breadcrumbs items={[
          { label: 'Student Portal', href: '/student-portal' },
          { label: 'Assignments', href: '/student-portal/assignments' },
          { label: assignment.title },
        ]} />

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
                {courseName && <p className="text-sm text-slate-700 mt-0.5">{courseName}</p>}
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-700 border-t border-gray-100 pt-4">
            {assignment.due_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-700" />
                <span>Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {isOverdue && <span className="text-red-600 font-medium ml-1">(Overdue)</span>}
              </div>
            )}
            {assignment.max_points && (
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-700" />
                <span>{assignment.max_points} points</span>
              </div>
            )}
            {isLate && assignment.late_penalty_percent > 0 && (
              <span className="text-amber-600 text-xs font-medium">Late penalty: {assignment.late_penalty_percent}%</span>
            )}
          </div>
        </div>

        {/* Description / Instructions */}
        {(assignment.description || assignment.instructions) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            {assignment.description && (
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Description</h2>
                <p className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed">{assignment.description}</p>
              </div>
            )}
            {assignment.instructions && (
              <div className={assignment.description ? 'border-t border-gray-100 pt-3' : ''}>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">Instructions</h2>
                <p className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed">{assignment.instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Existing submission */}
        {submission && (
          <div className={`rounded-2xl border p-6 space-y-4 ${
            submission.status === 'approved' ? 'border-brand-green-200 bg-brand-green-50'
            : submission.status === 'rejected' ? 'border-red-200 bg-red-50'
            : 'border-brand-blue-200 bg-brand-blue-50'
          }`}>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${
                submission.status === 'approved' ? 'text-brand-green-600'
                : submission.status === 'rejected' ? 'text-red-600'
                : 'text-brand-blue-600'
              }`} />
              <h2 className="font-semibold text-slate-900">Your Submission</h2>
              <span className="text-xs text-slate-700 ml-auto">
                {new Date(submission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {isLate && <span className="text-amber-600 ml-1">(late)</span>}
              </span>
            </div>

            {submission.submission_text && (
              <p className="text-sm text-slate-900 whitespace-pre-wrap bg-white/60 rounded-lg p-3">{submission.submission_text}</p>
            )}

            {submission.file_urls && submission.file_urls.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">Attached files:</p>
                <ul className="space-y-1">
                  {submission.file_urls.map((url: string, i: number) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-blue-600 hover:underline flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {url.split('/').pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {submission.instructor_note && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Instructor Feedback</p>
                <p className="text-sm text-slate-900">{submission.instructor_note}</p>
                {submission.reviewed_at && (
                  <p className="text-xs text-slate-700 mt-1">
                    Reviewed {new Date(submission.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}

            {submission.status === 'rejected' && (
              <div className="border-t border-red-200 pt-4">
                <p className="text-sm font-semibold text-red-700 mb-3">Revision required — please resubmit below.</p>
                <SubmitAssignmentForm
                  assignmentId={assignment.id}
                  lessonId={assignment.lesson_id ?? null}
                  courseId={assignment.course_id ?? ''}
                  stepType="assignment"
                  allowedFileTypes={assignment.allowed_file_types}
                  maxFileSizeMb={assignment.max_file_size_mb ?? 10}
                />
              </div>
            )}
          </div>
        )}

        {/* Submission form */}
        {!submission && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Submit Your Work</h2>
            <p className="text-sm text-slate-700 mb-5">
              {assignment.submission_type === 'file' ? 'Upload your completed work as a file.'
                : assignment.submission_type === 'text' ? 'Write your response in the text box below.'
                : 'Write a response and/or attach files.'}
            </p>

            <SubmitAssignmentForm
              assignmentId={assignment.id}
              lessonId={assignment.lesson_id ?? null}
              courseId={assignment.course_id ?? ''}
              stepType="assignment"
              allowedFileTypes={assignment.allowed_file_types}
              maxFileSizeMb={assignment.max_file_size_mb ?? 10}
            />
          </div>
        )}

      </div>
    </div>
  );
}
