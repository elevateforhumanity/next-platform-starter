import Image from 'next/image';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import {
  BarChart3, Users, BookOpen, AlertTriangle, Settings, Brain,
  DollarSign, Shield, Briefcase, Megaphone, Wrench, ChevronRight,
  ExternalLink, ArrowRight, TrendingUp, Award, GraduationCap,
} from 'lucide-react';
import { AdminGreeting } from '@/components/admin/AdminGreeting';

export const dynamic = 'force-dynamic';

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  ?? 'https://www.elevateforhumanity.org';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.elevateforhumanity.org';
const LMS_URL   = process.env.NEXT_PUBLIC_LMS_URL   ?? `${SITE_URL}/lms`;

const LIVE_LINKS = [
  { label: 'Public Site', url: SITE_URL },
  { label: 'Admin',       url: ADMIN_URL },
  { label: 'LMS',         url: LMS_URL },
  { label: 'Programs',    url: `${SITE_URL}/programs` },
  { label: 'Apply',       url: `${SITE_URL}/apply` },
];

const NAV_SECTIONS = [
  { label: 'Operations', href: '/admin/dashboard',      icon: BarChart3,  description: 'Analytics & monitoring',  light: 'bg-blue-50 text-blue-700' },
  { label: 'Students',   href: '/admin/students',       icon: Users,      description: 'Applications & progress', light: 'bg-emerald-50 text-emerald-700' },
  { label: 'Programs',   href: '/admin/programs',       icon: BookOpen,   description: 'Courses & credentials',   light: 'bg-violet-50 text-violet-700' },
  { label: 'Build',      href: '/admin/course-builder', icon: Wrench,     description: 'Content & media',         light: 'bg-orange-50 text-orange-700' },
  { label: 'AI Studio',  href: '/admin/ai-console',     icon: Brain,      description: 'Copilot & automation',    light: 'bg-pink-50 text-pink-700' },
  { label: 'Funding',    href: '/admin/funding',        icon: DollarSign, description: 'Grants, WIOA & payroll',  light: 'bg-amber-50 text-amber-700' },
  { label: 'Partners',   href: '/admin/employers',      icon: Briefcase,  description: 'Employers & providers',   light: 'bg-cyan-50 text-cyan-700' },
  { label: 'Marketing',  href: '/admin/marketing',      icon: Megaphone,  description: 'CRM & campaigns',         light: 'bg-rose-50 text-rose-700' },
  { label: 'Compliance', href: '/admin/compliance',     icon: Shield,     description: 'Audit & governance',      light: 'bg-slate-100 text-slate-700' },
  { label: 'System',     href: '/admin/settings',       icon: Settings,   description: 'Settings & integrations', light: 'bg-indigo-50 text-indigo-700' },
];

function fmtUsd(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}
function fmtNum(n: number) { return new Intl.NumberFormat('en-US').format(n); }
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function AdminLandingPage() {
  const missingEnv = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY']
    .filter((k) => !process.env[k]);
  if (missingEnv.length > 0) {
    return (
      <main className="p-8 font-mono">
        <h1 className="text-red-700 text-xl font-bold mb-2">Admin dashboard not ready</h1>
        <pre className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">{JSON.stringify({ missing: missingEnv }, null, 2)}</pre>
      </main>
    );
  }

  await requireAdmin();
  const data = await getAdminDashboardData();
  const firstName   = data.profile?.full_name?.split(' ')[0] ?? 'Admin';
  const pendingApps = data.counts.pendingApplications;

  const stats = [
    { label: 'Applications waiting', value: fmtNum(data.counts.pendingApplications),  href: '/admin/applications?status=submitted', urgent: data.counts.pendingApplications > 0, icon: AlertTriangle },
    { label: 'Active enrollments',   value: fmtNum(data.counts.activeEnrollments),     href: '/admin/enrollments',  urgent: false, icon: TrendingUp },
    { label: 'Revenue this month',   value: fmtUsd(data.counts.revenueThisMonthCents), href: '/admin/reports',      urgent: false, icon: DollarSign },
    { label: 'Certificates issued',  value: fmtNum(data.counts.certificatesIssued),    href: '/admin/certificates', urgent: false, icon: Award },
  ];

  return (
    <div className="bg-white min-h-screen">

      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-slate-900" style={{ height: 'clamp(260px,38vw,500px)' }}>
        <Image src="/images/pages/admin-dashboard-hero.jpg" alt="Elevate for Humanity Admin" fill priority
          className="object-cover object-center opacity-60" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-5 sm:px-10 lg:px-16 pb-8 sm:pb-12">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-2">
            Elevate for Humanity · Admin Portal
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-none mb-4">
            <AdminGreeting name={firstName} />
          </h1>
          {pendingApps > 0 && (
            <Link href="/admin/applications?status=submitted"
              className="inline-flex items-center gap-2 self-start px-4 sm:px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {fmtNum(pendingApps)} application{pendingApps !== 1 ? 's' : ''} waiting
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          )}
        </div>
      </section>

      {/* LIVE LINKS */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 shrink-0">Live</span>
          {LIVE_LINKS.map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
              {l.label} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="border-b border-slate-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.label} href={s.href}
                  className="group flex flex-col gap-1 px-4 sm:px-6 py-6 sm:py-8 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${s.urgent ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</span>
                  </div>
                  <span className={`text-3xl sm:text-4xl font-black tabular-nums leading-none ${s.urgent ? 'text-amber-600' : 'text-slate-900'}`}>
                    {s.value}
                  </span>
                  <span className="text-xs text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-0.5 mt-1">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* NAV GRID */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Navigation</p>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-6 sm:mb-8">Where do you want to go?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {NAV_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} href={s.href}
                className="group flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all bg-white">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${s.light}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{s.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug hidden sm:block">{s.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* PENDING APPLICATIONS */}
      {data.recentApplications.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Needs action</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Pending applications</h2>
              </div>
              <Link href="/admin/applications" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 ml-4">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
              {data.recentApplications.slice(0, 8).map((app) => (
                <Link key={app.id} href={app.href}
                  className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate text-sm sm:text-base">
                      {(app.full_name ?? `${app.first_name ?? ''} ${app.last_name ?? ''}`.trim()) || 'Unknown applicant'}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 truncate">{app.program_interest ?? 'No program specified'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${app.urgent ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {app.age_days === 0 ? 'Today' : app.age_days === 1 ? '1d ago' : `${app.age_days}d`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AT-RISK + RECENT STUDENTS */}
      <div className="border-t border-slate-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {data.inactiveLearners.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Retention</p>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">At-risk learners</h2>
                  </div>
                  <Link href="/admin/at-risk" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 ml-4">
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                  {data.inactiveLearners.slice(0, 5).map((l) => (
                    <Link key={l.enrollmentId} href={l.href}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-sm">{l.fullName ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-500 truncate">{l.email ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-slate-400">{fmtDate(l.enrolledAt)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {data.recentStudents.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">New this week</p>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Recent students</h2>
                  </div>
                  <Link href="/admin/students" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 ml-4">
                    All students <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                  {data.recentStudents.slice(0, 5).map((s) => (
                    <Link key={s.id} href={s.href}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-sm">{s.full_name ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-500 truncate">{s.program_name ?? s.email ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-slate-400">{fmtDate(s.created_at)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOP PROGRAMS */}
      {data.topPrograms.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-1">Enrollment</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Top programs</h2>
              </div>
              <Link href="/admin/programs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 ml-4">
                All programs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {data.topPrograms.map((prog) => (
                <div key={prog.id} className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-slate-100 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 text-violet-600" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm leading-snug">{prog.title}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{fmtNum(prog.learners)} learners</span>
                    <span className="font-semibold text-slate-900">{prog.completionRate}% complete</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(prog.completionRate, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEV STUDIO CTA */}
      <div className="border-t border-slate-100 bg-slate-900">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Admin Tools</p>
            <h2 className="text-xl sm:text-2xl font-black text-white">Dev Studio</h2>
            <p className="text-sm text-slate-400 mt-1">Run commands, generate courses, smoke test, deploy.</p>
          </div>
          <Link href="/admin/dev-studio"
            className="inline-flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold text-sm transition-colors shrink-0">
            Open Dev Studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="h-12 sm:h-16" />
    </div>
  );
}
