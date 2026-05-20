import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Scissors,
  Clock,
  BookOpen,
  FileText,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  ArrowRight,
  GraduationCap,
  Wrench,
  ChefHat,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getApprovedHoursByType } from '@/lib/hours/get-approved-hours';
import { getApprenticeshipRequiredHours } from '@/lib/compliance/apprenticeship';

export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Track your apprenticeship hours, competencies, and training progress.',
};

export const dynamic = 'force-dynamic';

// ── Program-specific config ───────────────────────────────────────────────────

const PROGRAM_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    accentBg: string;
    accentText: string;
    requiredOjl: number;
    requiredRti: number;
    competenciesPath: string;
  }
> = {
  'barber-apprenticeship': {
    label: 'Barber Apprenticeship',
    icon: Scissors,
    color: 'amber',
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-600',
    requiredOjl: 1500,
    requiredRti: 500,
    competenciesPath: '/apprentice/competencies',
  },
  'cosmetology-apprenticeship': {
    label: 'Cosmetology Apprenticeship',
    icon: Scissors,
    color: 'pink',
    accentBg: 'bg-pink-500',
    accentText: 'text-pink-600',
    requiredOjl: 1500,
    requiredRti: 500,
    competenciesPath: '/apprentice/competencies',
  },
  'esthetician-apprenticeship': {
    label: 'Esthetician Apprenticeship',
    icon: Scissors,
    color: 'rose',
    accentBg: 'bg-rose-500',
    accentText: 'text-rose-600',
    requiredOjl: 525,
    requiredRti: 175,
    competenciesPath: '/apprentice/competencies',
  },
  'electrical': {
    label: 'Electrical Apprenticeship',
    icon: Zap,
    color: 'yellow',
    accentBg: 'bg-yellow-500',
    accentText: 'text-yellow-600',
    requiredOjl: 7000,
    requiredRti: 1000,
    competenciesPath: '/apprentice/competencies',
  },
  'plumbing': {
    label: 'Plumbing Apprenticeship',
    icon: Wrench,
    color: 'blue',
    accentBg: 'bg-blue-500',
    accentText: 'text-blue-600',
    requiredOjl: 7000,
    requiredRti: 1000,
    competenciesPath: '/apprentice/competencies',
  },
  'culinary-apprenticeship': {
    label: 'Culinary Apprenticeship',
    icon: ChefHat,
    color: 'orange',
    accentBg: 'bg-orange-500',
    accentText: 'text-orange-600',
    requiredOjl: 3000,
    requiredRti: 500,
    competenciesPath: '/apprentice/competencies',
  },
};

const DEFAULT_CONFIG = {
  label: 'Apprenticeship',
  icon: GraduationCap,
  color: 'blue',
  accentBg: 'bg-blue-600',
  accentText: 'text-blue-600',
  requiredOjl: 2000,
  requiredRti: 0,
  competenciesPath: '/apprentice/competencies',
};

// ── Quick links ───────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    name: 'Timeclock',
    href: '/apprentice/timeclock',
    icon: Clock,
    description: 'Clock in / out at your work site',
  },
  {
    name: 'Log Hours',
    href: '/apprentice/hours/log',
    icon: Clock,
    description: 'Manually record OJL & RTI hours',
  },
  {
    name: 'Hours History',
    href: '/apprentice/hours',
    icon: TrendingUp,
    description: 'Review all submitted hour entries',
  },
  {
    name: 'Competency Log',
    href: '/apprentice/competencies/log',
    icon: Scissors,
    description: 'Log a service for WPS credit',
  },
  {
    name: 'Competency Progress',
    href: '/apprentice/competencies',
    icon: Award,
    description: 'Track skills & WPS progress',
  },
  {
    name: 'Documents',
    href: '/apprentice/documents',
    icon: FileText,
    description: 'Upload & view required documents',
  },
  {
    name: 'Skills Checklist',
    href: '/apprentice/skills',
    icon: Award,
    description: 'Track skill competencies',
  },
  {
    name: 'Handbook',
    href: '/apprentice/handbook',
    icon: BookOpen,
    description: 'Apprenticeship guidelines',
  },
  {
    name: 'State Board Prep',
    href: '/apprentice/state-board',
    icon: GraduationCap,
    description: 'Exam preparation resources',
  },
  {
    name: 'Transfer Hours',
    href: '/apprentice/transfer-hours',
    icon: ArrowRight,
    description: 'Request hour transfers',
  },
  {
    name: 'Manage Payments',
    href: '/apprentice/billing',
    icon: CreditCard,
    description: 'Update payment method & invoices',
  },
  {
    name: 'Shift History',
    href: '/apprentice/timeclock/history',
    icon: Clock,
    description: 'View all recorded shifts',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ApprenticePortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/portal/apprentice');

  // ── Profile ───────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, portal_type')
    .eq('id', user.id)
    .maybeSingle();

  // ── Active enrollment ─────────────────────────────────────────────────────
  // Split into two selects to avoid Supabase type inferencer collapsing long
  // select strings to GenericStringError.
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

  const enrollment = enrollmentBase
    ? { ...enrollmentBase, ...(enrollmentExtra ?? {}) }
    : null;

  // ── Program config ────────────────────────────────────────────────────────
  const programSlug = enrollment?.program_slug ?? null;
  const config = (programSlug && PROGRAM_CONFIG[programSlug]) || DEFAULT_CONFIG;
  const ProgramIcon = config.icon;

  // ── Hours ─────────────────────────────────────────────────────────────────
  const hours = await getApprovedHoursByType(supabase, user.id, programSlug ?? undefined);
  const requiredOjl = config.requiredOjl;
  const requiredRti = config.requiredRti;
  const ojlPercent = requiredOjl > 0 ? Math.min((hours.ojl / requiredOjl) * 100, 100) : 0;
  const rtiPercent = requiredRti > 0 ? Math.min((hours.rti / requiredRti) * 100, 100) : 0;

  // ── Onboarding checklist ──────────────────────────────────────────────────
  const { data: docs } = await supabase
    .from('documents')
    .select('document_type, status, verification_status')
    .eq('user_id', user.id);

  const hasPhotoId = (docs ?? []).some((d) => d.document_type === 'photo_id');
  const hasResidency = (docs ?? []).some(
    (d) => d.document_type === 'proof_of_residency' || d.document_type === 'other',
  );
  const docsApproved =
    (docs ?? []).length > 0 &&
    (docs ?? []).every(
      (d) => d.status === 'approved' || d.verification_status === 'verified',
    );
  const hasSubscription = !!enrollment?.stripe_subscription_id;

  const onboardingItems = [
    {
      label: 'Orientation completed',
      done: !!enrollment?.orientation_completed_at,
      href: programSlug ? `/programs/${programSlug}/orientation` : '/portal/apprentice',
    },
    { label: 'Photo ID uploaded', done: hasPhotoId, href: '/apprentice/documents' },
    { label: 'Proof of residency uploaded', done: hasResidency, href: '/apprentice/documents' },
    { label: 'Documents approved', done: docsApproved, href: '/apprentice/documents' },
    { label: 'Payment method on file', done: hasSubscription, href: '/apprentice/billing' },
  ];
  const onboardingComplete = onboardingItems.every((i) => i.done);
  const pendingItems = onboardingItems.filter((i) => !i.done);

  // ── Render ────────────────────────────────────────────────────────────────
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Apprentice';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${config.accentBg} rounded-xl flex items-center justify-center`}>
              <ProgramIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
                Apprentice Portal
              </p>
              <h1 className="text-lg font-bold leading-tight">{config.label}</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">Signed in as</p>
            <p className="text-sm font-medium">{profile?.full_name ?? user.email}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Payment alert ── */}
        {!hasSubscription && enrollment && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">Payment method required</p>
              <p className="text-red-700 text-sm mt-1">
                Add a card on file before your down payment credit runs out.
              </p>
              <Link
                href="/apprentice/billing"
                className="inline-flex items-center gap-2 mt-3 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <CreditCard className="w-4 h-4" /> Add Payment Method
              </Link>
            </div>
          </div>
        )}

        {/* ── Onboarding checklist ── */}
        {!onboardingComplete && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <p className="font-semibold text-amber-800 text-sm">
                {pendingItems.length} onboarding{' '}
                {pendingItems.length === 1 ? 'item' : 'items'} still needed
              </p>
            </div>
            <ul className="space-y-2">
              {onboardingItems.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  {item.done ? (
                    <span className="text-slate-400 line-through">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="text-amber-800 font-medium hover:underline">
                      {item.label} →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Welcome + hours ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Welcome back, {firstName}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {programSlug
              ? `${config.label} · Registered Apprenticeship`
              : 'Registered Apprenticeship Program'}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* OJL */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">
                  On-the-Job Learning (OJL)
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {hours.ojl.toLocaleString()} / {requiredOjl.toLocaleString()} hrs
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.accentBg} rounded-full transition-all duration-500`}
                  style={{ width: `${ojlPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {Math.max(0, requiredOjl - hours.ojl).toLocaleString()} hours remaining
              </p>
            </div>

            {/* RTI */}
            {requiredRti > 0 && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Related Technical Instruction (RTI)
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {hours.rti.toLocaleString()} / {requiredRti.toLocaleString()} hrs
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${rtiPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {Math.max(0, requiredRti - hours.rti).toLocaleString()} hours remaining
                </p>
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/apprentice/timeclock"
              className={`inline-flex items-center gap-2 ${config.accentBg} text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition text-sm`}
            >
              <Clock className="w-4 h-4" /> Clock In
            </Link>
            <Link
              href="/apprentice/hours/log"
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition text-sm"
            >
              <TrendingUp className="w-4 h-4" /> Log Hours
            </Link>
            <Link
              href="/apprentice/competencies/log"
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition text-sm"
            >
              <Award className="w-4 h-4" /> Log Service
            </Link>
          </div>
        </div>

        {/* ── Quick links grid ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
            All Tools
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-slate-200 transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition shrink-0">
                    <link.icon className={`w-4 h-4 ${config.accentText}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{link.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{link.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Footer nav ── */}
        <div className="pt-2 pb-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/learner/dashboard" className="hover:text-slate-600 transition">
            ← Student Dashboard
          </Link>
          <Link href="/apprentice" className="hover:text-slate-600 transition">
            Legacy Apprentice Portal
          </Link>
          <Link href="/help" className="hover:text-slate-600 transition">
            Help Center
          </Link>
        </div>
      </main>
    </div>
  );
}
