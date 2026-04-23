import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  TrendingUp, Users, DollarSign, Award, Briefcase,
  GraduationCap, ArrowRight, CheckCircle,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Funding Impact | How Federal Workforce Funding Transforms Lives | Elevate for Humanity',
  description: 'See the measurable impact of WIOA, WRG, DOL, and FSSA workforce funding at Elevate for Humanity — credential attainment, job placement, and wage outcomes.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding-impact' },
};

const FUNDING_SOURCES = [
  { name: 'WIOA', full: 'Workforce Innovation and Opportunity Act', href: '/funding/how-it-works#wioa' },
  { name: 'WRG', full: 'Workforce Ready Grant', href: '/funding/how-it-works' },
  { name: 'JRI', full: 'Job Ready Indy', href: '/funding/how-it-works' },
  { name: 'DOL', full: 'Dept. of Labor Apprenticeship', href: '/programs/apprenticeships' },
  { name: 'FSSA', full: 'SNAP E&T / IMPACT Program', href: '/fssa' },
];

export default async function FundingImpactPage() {
  const db = await getAdminClient();

  // Live outcome data
  const { count: totalEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: completedEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: activeEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Impact metrics from DB
  const { data: metrics } = await db
    .from('impact_metrics')
    .select('id, category, metric_name, metric_value, metric_unit')
    .order('category');

  // Published programs count
  const { count: programCount } = await db
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)
    .eq('is_active', true);

  const stats = [
    { label: 'Total Enrollments', value: totalEnrollments ?? '—', icon: Users },
    { label: 'Program Completions', value: completedEnrollments ?? '—', icon: GraduationCap },
    { label: 'Active Participants', value: activeEnrollments ?? '—', icon: TrendingUp },
    { label: 'Funded Programs', value: programCount ?? '—', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Funding Impact' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[380px] overflow-hidden">
        <Image
          src="/images/pages/impact-video-poster.jpg"
          alt="Workforce funding impact"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 pb-10 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">Federal Workforce Funding</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Funding Impact</h1>
            <p className="text-slate-200 text-lg max-w-2xl">
              Real outcomes from WIOA, WRG, DOL, and FSSA investment — credential attainment, job placement, and wage growth for Indiana workers.
            </p>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="bg-brand-red-600 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label}>
                <Icon className="w-6 h-6 text-red-200 mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-red-100 text-sm mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* DB-driven impact metrics */}
      {metrics && metrics.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Outcome Metrics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {metrics.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-200 p-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{m.category}</p>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {m.metric_value}{m.metric_unit ? ` ${m.metric_unit}` : ''}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{m.metric_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Funding sources */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Funding Sources</h2>
          <p className="text-slate-600 mb-8">Elevate for Humanity is approved to receive funding from multiple federal and state workforce programs.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FUNDING_SOURCES.map((f) => (
              <Link
                key={f.name}
                href={f.href}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition"
              >
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">{f.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.full}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <DollarSign className="w-10 h-10 text-brand-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Check Your Funding Eligibility</h2>
          <p className="text-slate-300 mb-8">
            Most participants qualify for funded training through WIOA, WRG, or FSSA. Find out which programs you're eligible for.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/eligibility" className="rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition">
              Check Eligibility
            </Link>
            <Link href="/funding" className="rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition flex items-center gap-2">
              How Funding Works <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
