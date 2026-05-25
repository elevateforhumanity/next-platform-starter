import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scissors,
  Clock,
  BookOpen,
  FileText,
  Award,
  TrendingUp,
  AlertTriangle,
  XCircle,
  CreditCard,
  GraduationCap,
  Wrench,
  ChefHat,
  Zap,
  User,
  CalendarDays,
  ClipboardCheck,
  MapPin,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getApprovedHoursByType } from '@/lib/hours/get-approved-hours';

export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Track your apprenticeship hours, competencies, and training progress.',
};

export const dynamic = 'force-dynamic';

const PROGRAM_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    accentBg: string;
    accentText: string;
    heroImage: string;
    shopLabel: string;
    requiredOjl: number;
    requiredRti: number;
  }
> = {
  'barber-apprenticeship': {
    label: 'Barber Apprenticeship',
    icon: Scissors,
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-600',
    heroImage: '/images/pages/barber-hero.webp',
    shopLabel: 'Barber Shop',
    requiredOjl: 1500,
    requiredRti: 500,
  },
  'cosmetology-apprenticeship': {
    label: 'Cosmetology Apprenticeship',
    icon: Scissors,
    accentBg: 'bg-pink-500',
    accentText: 'text-pink-600',
    heroImage: '/images/pages/cosmetology-hero.webp',
    shopLabel: 'Salon',
    requiredOjl: 1500,
    requiredRti: 500,
  },
  'esthetician-apprenticeship': {
    label: 'Esthetician Apprenticeship',
    icon: Scissors,
    accentBg: 'bg-rose-500',
    accentText: 'text-rose-600',
    heroImage: '/images/pages/esthetician.webp',
    shopLabel: 'Spa / Salon',
    requiredOjl: 525,
    requiredRti: 175,
  },
  'electrical': {
    label: 'Electrical Apprenticeship',
    icon: Zap,
    accentBg: 'bg-yellow-500',
    accentText: 'text-yellow-600',
    heroImage: '/images/pages/electrical.webp',
    shopLabel: 'Job Site',
    requiredOjl: 7000,
    requiredRti: 1000,
  },
  'plumbing': {
    label: 'Plumbing Apprenticeship',
    icon: Wrench,
    accentBg: 'bg-blue-500',
    accentText: 'text-blue-600',
    heroImage: '/images/pages/plumbing-pipes.webp',
    shopLabel: 'Job Site',
    requiredOjl: 7000,
    requiredRti: 1000,
  },
  'culinary-apprenticeship': {
    label: 'Culinary Apprenticeship',
    icon: ChefHat,
    accentBg: 'bg-orange-500',
    accentText: 'text-orange-600',
    heroImage: '/images/pages/culinary.webp',
    shopLabel: 'Kitchen',
    requiredOjl: 3000,
    requiredRti: 500,
  },
};

const DEFAULT_CONFIG = {
  label: 'Apprenticeship',
  icon: GraduationCap,
  accentBg: 'bg-blue-600',
  accentText: 'text-blue-600',
  heroImage: '/images/pages/apprenticeship-hero.webp',
  shopLabel: 'Host Shop',
  requiredOjl: 2000,
  requiredRti: 0,
};

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', href: '/portal/apprentice' },
  { id: 'hours', label: 'Hours', href: '/apprentice/hours' },
  { id: 'timeclock', label: 'Timeclock', href: '/apprentice/timeclock' },
  { id: 'competencies', label: 'Competencies', href: '/apprentice/competencies' },
  { id: 'documents', label: 'Documents', href: '/apprentice/documents' },
  { id: 'billing', label: 'Billing', href: '/apprentice/billing' },
  { id: 'handbook', label: 'Handbook', href: '/apprentice/handbook' },
];

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal/apprentice');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, portal_type')
    .eq('id', user.id)
    .maybeSingle();

  const { data: enrollmentBase } = await supabase
    .from('program_enrollments')
    .select('id, program_id, program_slug, enrollment_state')
    .eq('user_id', user.id)
    .eq('enrollment_state', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: enrollmentExtra } = enrollmentBase?.id
    ? await supabase
        .from('program_enrollments')
        .select('orientation_completed_at, documents_submitted_at, stripe_subscription_id')
        .eq('id', enrollmentBase.id)
        .maybeSingle()
    : { data: null };

  const enrollment = enrollmentBase ? { ...enrollmentBase, ...(enrollmentExtra ?? {}) } : null;

  const programSlug = enrollment?.program_slug ?? null;
  const config = (programSlug && PROGRAM_CONFIG[programSlug]) || DEFAULT_CONFIG;
  const ProgramIcon = config.icon;

  const hours = await getApprovedHoursByType(supabase, user.id, programSlug ?? undefined);
  const requiredOjl = config.requiredOjl;
  const requiredRti = config.requiredRti;
  const ojlPercent = requiredOjl > 0 ? Math.min((hours.ojl / requiredOjl) * 100, 100) : 0;
  const rtiPercent = requiredRti > 0 ? Math.min((hours.rti / requiredRti) * 100, 100) : 0;
  const totalHours = hours.ojl + hours.rti;
  const totalRequired = requiredOjl + requiredRti;
  const overallPercent = totalRequired > 0 ? Math.min((totalHours / totalRequired) * 100, 100) : 0;

  const { data: docs } = await supabase
    .from('documents')
    .select('document_type, status, verification_status')
    .eq('user_id', user.id);

  const hasPhotoId = (docs ?? []).some((d) => d.document_type === 'photo_id');
  const hasResidency = (docs ?? []).some(
    (d) => d.document_type === 'proof_of_residency' || d.document_type === 'other',
  );
  const docsApproved = (docs ?? []).length > 0 && (docs ?? []).every(
    (d) => d.status === 'approved' || d.verification_status === 'verified',
  );
  const hasSubscription = !!enrollment?.stripe_subscription_id;

  const onboardingItems = [
    { label: 'Orientation completed', done: !!enrollment?.orientation_completed_at, href: '/apprentice/handbook' },
    { label: 'Photo ID uploaded', done: hasPhotoId, href: '/apprentice/documents' },
    { label: 'Proof of residency uploaded', done: hasResidency, href: '/apprentice/documents' },
    { label: 'Documents approved', done: docsApproved, href: '/apprentice/documents' },
    { label: 'Payment method on file', done: hasSubscription, href: '/apprentice/billing' },
  ];
  const onboardingComplete = onboardingItems.every((i) => i.done);
  const completedCount = onboardingItems.filter((i) => i.done).length;

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Apprentice';
  const weeksComplete = Math.floor(totalHours / 40);
  const weeksTotal = Math.ceil(totalRequired / 40);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Banner ── */}
      <div className="relative h-[180px] sm:h-[220px] overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/95 via-brand-blue-800/70 to-transparent z-10" />
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src={config.heroImage}
          alt={config.label}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority placeholder="empty"
        />
        <div className="relative z-20 h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-11 h-11 ${config.accentBg} rounded-xl flex items-center justify-center shadow-lg`}>
                <ProgramIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Indiana Registered Apprenticeship
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{config.label}</h1>
              </div>
            </div>
            <p className="text-white/80 text-sm mt-2">
              Welcome back, <strong>{firstName}</strong> · Week {weeksComplete + 1} of {weeksTotal}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto gap-0" style={{ scrollbarWidth: 'none' }}>
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab.id === 'dashboard'
                    ? `border-slate-900 text-slate-900`
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Alerts ── */}
        {!hasSubscription && enrollment && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">Payment method required</p>
              <p className="text-red-700 text-xs mt-0.5">Set up weekly payments to stay enrolled.</p>
            </div>
            <Link href="/apprentice/billing" className={`${config.accentBg} text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition shrink-0`}>
              Set Up Payment
            </Link>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`w-4 h-4 ${config.accentText}`} />
              <p className="text-xs text-slate-500">Total Hours</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalHours.toLocaleString()}</p>
            <p className="text-xs text-slate-400">of {totalRequired.toLocaleString()} required</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className={`w-4 h-4 ${config.accentText}`} />
              <p className="text-xs text-slate-500">Weeks</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{weeksComplete}</p>
            <p className="text-xs text-slate-400">of {weeksTotal} complete</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className={`w-4 h-4 ${config.accentText}`} />
              <p className="text-xs text-slate-500">Onboarding</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{completedCount}/{onboardingItems.length}</p>
            <p className="text-xs text-slate-400">{onboardingComplete ? 'Complete' : 'In progress'}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className={`w-4 h-4 ${config.accentText}`} />
              <p className="text-xs text-slate-500">Progress</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{Math.round(overallPercent)}%</p>
            <p className="text-xs text-slate-400">toward completion</p>
          </div>
        </div>

        {/* ── Progress Bars ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Hour Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">On-the-Job Learning (OJL)</span>
                <span className="text-sm font-bold text-slate-900">{hours.ojl.toLocaleString()} / {requiredOjl.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${config.accentBg} rounded-full transition-all duration-700`} style={{ width: `${ojlPercent}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{Math.max(0, requiredOjl - hours.ojl).toLocaleString()} hours remaining</p>
            </div>
            {requiredRti > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">Related Technical Instruction (RTI)</span>
                  <span className="text-sm font-bold text-slate-900">{hours.rti.toLocaleString()} / {requiredRti.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${rtiPercent}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{Math.max(0, requiredRti - hours.rti).toLocaleString()} hours remaining</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Actions + Onboarding ── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <Link href="/apprentice/timeclock" className={`flex items-center gap-3 p-3 rounded-lg ${config.accentBg} text-white hover:opacity-90 transition`}>
                <Clock className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">Clock In / Out</p>
                  <p className="text-xs text-white/80">Start or end your shift</p>
                </div>
              </Link>
              <Link href="/apprentice/hours/log" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <TrendingUp className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Log Hours</p>
                  <p className="text-xs text-slate-500">Record OJL or RTI hours</p>
                </div>
              </Link>
              <Link href="/apprentice/competencies/log" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <Award aria-label="award" className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Log Service</p>
                  <p className="text-xs text-slate-500">Record a competency</p>
                </div>
              </Link>
              <Link href="/apprentice/documents" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <FileText className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Upload Document</p>
                  <p className="text-xs text-slate-500">Submit required files</p>
                </div>
              </Link>
              <Link href="/apprentice/state-board" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <GraduationCap aria-label="graduationcap" className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">State Board Prep</p>
                  <p className="text-xs text-slate-500">Exam preparation</p>
                </div>
              </Link>
              <Link href="/apprentice/billing" className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                <CreditCard className={`w-5 h-5 ${config.accentText}`} />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Billing</p>
                  <p className="text-xs text-slate-500">Payments & invoices</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Onboarding Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Onboarding {onboardingComplete && <span className="text-brand-green-600 ml-1">✓ Complete</span>}
            </h2>
            <ul className="space-y-2.5">
              {onboardingItems.map((item) => (
                <li key={item.label}>
                  {item.done ? (
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span className="w-4 h-4 rounded-full bg-brand-green-500 inline-block flex-shrink-0 shrink-0" aria-hidden="true" />
                      <span className="line-through">{item.label}</span>
                    </div>
                  ) : (
                    <Link href={item.href} className="flex items-center gap-2.5 text-sm text-slate-800 hover:text-slate-900 group">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="group-hover:underline">{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Additional Resources ── */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/apprentice/skills" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition group">
            <Award aria-label="award" className={`w-5 h-5 ${config.accentText} mb-2`} />
            <p className="font-semibold text-sm text-slate-900">Skills Checklist</p>
            <p className="text-xs text-slate-500 mt-0.5">Track competency mastery</p>
          </Link>
          <Link href="/apprentice/handbook" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition group">
            <BookOpen className={`w-5 h-5 ${config.accentText} mb-2`} />
            <p className="font-semibold text-sm text-slate-900">Handbook</p>
            <p className="text-xs text-slate-500 mt-0.5">Rules & guidelines</p>
          </Link>
          <Link href="/apprentice/transfer-hours" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition group">
            <MapPin className={`w-5 h-5 ${config.accentText} mb-2`} />
            <p className="font-semibold text-sm text-slate-900">Transfer Hours</p>
            <p className="text-xs text-slate-500 mt-0.5">Request hour transfers</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
