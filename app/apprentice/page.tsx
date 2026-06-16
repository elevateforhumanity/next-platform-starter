import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Clock,
  FileText,
  Award,
  BookOpen,
  ArrowRight,
  Scissors,
  AlertTriangle,
  CreditCard,
  XCircle,
  Home,
  Video,
  ClipboardList,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getNextRequiredAction } from '@/lib/enrollment/gate';
import { getApprenticeshipRequiredHours } from '@/lib/compliance/apprenticeship';
import { listUnifiedEnrollments, resolveLatestEnrollment } from '@/lib/enrollment/resolver';

export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Track your apprenticeship progress, hours, and certifications.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apprentice',
  },
};

export const dynamic = 'force-dynamic';

export default async function ApprenticePortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const enrollment = await resolveLatestEnrollment({
    client: supabase,
    userId: user.id,
    prefer: 'program_enrollments',
  });

  // Get next required action based on real enrollment state
  const nextAction = enrollment
    ? getNextRequiredAction({
        status: enrollment.status,
        orientation_completed_at: enrollment.orientationCompletedAt,
        documents_submitted_at: enrollment.documentsSubmittedAt,
        program_slug: enrollment.programSlug ?? undefined,
      })
    : { label: 'Apply to a Program', href: '/programs', description: 'Start your journey' };

  const enrollments = await listUnifiedEnrollments(supabase, user.id, 5);

  // Hours source — barber/cosmetology students use hour_entries (approved).
  // Legacy students use attendance_hours linked to their training_enrollments row.
  const { data: attendanceHoursData } = await supabase
    .from('attendance_hours')
    .select('hours_logged')
    .eq('enrollment_id', enrollment?.id ?? '');

  const attendanceHours =
    attendanceHoursData?.reduce((sum, h) => sum + (h.hours_logged || 0), 0) || 0;

  let totalHours = attendanceHours;

  // Fallback: if no attendance hours (e.g. barber students who log via hour_entries),
  // sum approved hour_entries for this user instead.
  if (totalHours === 0) {
    const { data: hourEntries } = await supabase
      .from('hour_entries')
      .select('hours_claimed, accepted_hours')
      .eq('user_id', user.id)
      .eq('status', 'approved');

    const entryHours = (hourEntries || []).reduce(
      (sum, h) => sum + (Number(h.accepted_hours) || Number(h.hours_claimed) || 0),
      0,
    );
    if (entryHours > 0) totalHours = entryHours;
  }

  const programSlugForHours = enrollment?.programSlug ?? null;
  const requiredHours = getApprenticeshipRequiredHours(programSlugForHours);
  const hoursProgressPercent = requiredHours
    ? Math.min((totalHours / requiredHours) * 100, 100)
    : 0;

  // --- Payment alerts ---
  // Check for open Stripe invoices / missing payment method
  const hasSubscription = !!enrollment?.stripeSubscriptionId;
  const paymentStatus = enrollment?.paymentStatus ?? null;
  const amountPaidCents = enrollment?.amountPaidCents ?? 0;

  // --- Onboarding checklist ---
  const orientationDone = !!enrollment?.orientationCompletedAt;
  const documentsDone = !!enrollment?.documentsSubmittedAt;
  const { data: rawDocs } = await supabase
    .from('documents')
    .select('id, document_type, status, verification_status')
    .eq('user_id', user.id);
  const docs = rawDocs ?? [];
  const hasPhotoId = docs.some((d) => d.document_type === 'photo_id');
  const hasResidency = docs.some(
    (d) => d.document_type === 'other' || d.document_type === 'proof_of_residency',
  );
  const docsApproved =
    docs.length > 0 &&
    docs.every((d) => d.status === 'approved' || d.verification_status === 'verified');
  const onboardingItems = [
    {
      label: 'Orientation completed',
      done: orientationDone,
      href: enrollment?.programSlug
        ? `/programs/${enrollment.programSlug}/orientation`
        : '/apprentice',
    },
    { label: 'Photo ID uploaded', done: hasPhotoId, href: '/apprentice/documents' },
    { label: 'Proof of residency uploaded', done: hasResidency, href: '/apprentice/documents' },
    { label: 'Documents approved', done: docsApproved, href: '/apprentice/documents' },
    { label: 'Payment method on file', done: hasSubscription, href: '/apprentice/billing' },
  ];
  const onboardingComplete = onboardingItems.every((i) => i.done);
  const onboardingPending = onboardingItems.filter((i) => !i.done);

  const quickLinks = [
    {
      name: 'Workbook',
      href: '/apprentice/workbook',
      icon: BookOpen,
      description: 'Complete your training modules and coursework',
      color: 'bg-violet-100 text-violet-600',
    },
    {
      name: 'Course',
      href: '/apprentice/course',
      icon: Video,
      description: 'Watch video lessons and RTI training',
      color: 'bg-cyan-100 text-cyan-600',
    },
    {
      name: 'Timeclock',
      href: '/apprentice/timeclock',
      icon: Clock,
      description: 'Clock in / out at your work site',
      color: 'bg-brand-green-100 text-brand-green-600',
    },
    {
      name: 'Competencies',
      href: '/apprentice/competencies',
      icon: Scissors,
      description: 'Track your WPS skill progress',
      color: 'bg-pink-100 text-pink-600',
    },
    {
      name: 'Documents',
      href: '/apprentice/documents',
      icon: FileText,
      description: 'Upload and manage required documents',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      name: 'Checklist',
      href: '/apprentice/skills',
      icon: ClipboardList,
      description: 'View your skills checklist and progress',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      name: 'Billing',
      href: '/apprentice/billing',
      icon: CreditCard,
      description: 'Manage payments and view invoices',
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      name: 'Handbook',
      href: '/apprentice/handbook',
      icon: Award,
      description: 'Program guidelines and policies',
      color: 'bg-slate-100 text-slate-600',
    },
  ];

  // Nav items
  const navItems = [
    { href: '/apprentice', label: 'Dashboard', icon: Home },
    { href: '/apprentice/workbook', label: 'Workbook', icon: BookOpen },
    { href: '/apprentice/course', label: 'Course', icon: Video },
    { href: '/apprentice/timeclock', label: 'Timeclock', icon: Clock },
    { href: '/apprentice/competencies', label: 'Skills', icon: Scissors },
    { href: '/apprentice/documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">Apprentice Portal</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    item.href === '/apprentice'
                      ? 'bg-brand-blue-100 text-brand-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600 hidden sm:block">
                {profile?.full_name || 'Apprentice'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex px-4 py-2 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                item.href === '/apprentice'
                  ? 'bg-brand-blue-100 text-brand-blue-700'
                  : 'text-slate-600 bg-slate-100'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand-blue-700 to-indigo-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Welcome back</p>
              <h1 className="text-3xl font-bold mb-2">{profile?.full_name || 'Apprentice'}</h1>
              <p className="text-white/80">Track your apprenticeship journey and progress</p>
            </div>
            <Link
              href={nextAction.href}
              className="bg-white text-brand-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition flex items-center gap-2 shadow-lg whitespace-nowrap"
            >
              {nextAction.label}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {(!hasSubscription || !onboardingComplete) && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {!hasSubscription && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-800 text-sm">Payment Required</p>
                    <p className="text-red-700 text-xs mt-1">
                      Add a payment method to continue after your down payment credit runs out.
                    </p>
                    <Link href="/apprentice/billing" className="inline-flex items-center gap-1 mt-2 text-red-600 text-xs font-semibold hover:underline">
                      Add Payment <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {!onboardingComplete && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800 text-sm">
                      {onboardingPending.length} Item{onboardingPending.length > 1 ? 's' : ''} Pending
                    </p>
                    <ul className="text-amber-700 text-xs mt-1 space-y-1">
                      {onboardingPending.slice(0, 2).map((item) => (
                        <li key={item.label}>
                          <Link href={item.href} className="hover:underline">{item.label}</Link>
                        </li>
                      ))}
                      {onboardingPending.length > 2 && <li>+{onboardingPending.length - 2} more</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Your Progress</h2>
            <span className="text-sm text-slate-500">{hoursProgressPercent}% Complete</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 rounded-full transition-all"
                  style={{ width: `${hoursProgressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-900">
              {requiredHours
                ? `${totalHours.toLocaleString()} / ${requiredHours.toLocaleString()} hrs`
                : `${totalHours.toLocaleString()} hrs`}
            </span>
          </div>
        </div>

        {/* Quick Links Grid */}
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-slate-100"
            >
              <div className={`p-5 ${link.color}`}>
                <link.icon className="w-8 h-8 mb-0" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-blue-600 transition">{link.name}</h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-500 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-sm text-slate-500 mt-1">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Active Programs */}
        {enrollments && enrollments.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Programs</h2>
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {enrollment.programTitle || enrollment.courseId ? `Course ${enrollment.courseId}` : 'Program'}
                      </p>
                      <p className="text-sm text-slate-500 capitalize">{enrollment.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-blue-600">{enrollment.progress || 0}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
