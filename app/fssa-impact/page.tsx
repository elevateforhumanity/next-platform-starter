import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  TrendingUp, Users, Award, CheckCircle, ArrowRight,
  Briefcase, GraduationCap, DollarSign, AlertCircle,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'FSSA / IMPACT Program Outcomes | Elevate for Humanity',
  description: 'Measurable outcomes for FSSA IMPACT participants at Elevate for Humanity — credential attainment, job placement, and wage data for Indiana workforce reporting.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/fssa-impact' },
};

const PROGRAM_OUTCOMES = [
  { label: 'Credential Attainment Rate', value: '87%', icon: Award },
  { label: 'Job Placement (90-day)', value: '74%', icon: Briefcase },
  { label: 'Average Wage at Placement', value: '$18.40/hr', icon: DollarSign },
  { label: 'Program Completion Rate', value: '82%', icon: GraduationCap },
];

const ELIGIBLE_PROGRAMS = [
  { title: 'HVAC Technician', slug: 'hvac-technician', credential: 'EPA 608 Certification' },
  { title: 'CNA / Healthcare', slug: 'cna', credential: 'State CNA License' },
  { title: 'Barber Apprenticeship', slug: 'barber-apprenticeship', credential: 'Indiana Barber License' },
  { title: 'IT Help Desk', slug: 'it-help-desk', credential: 'CompTIA A+' },
  { title: 'Peer Recovery Specialist', slug: 'peer-recovery-specialist', credential: 'CPRS Certification' },
  { title: 'CDL Training', slug: 'cdl-training', credential: 'Class A CDL' },
];

export default async function FSSAImpactPage() {
  const db = await getAdminClient();

  // Pull platform-wide impact metrics
  const { data: metrics } = await db
    .from('impact_metrics')
    .select('id, category, metric_name, metric_value, metric_unit')
    .order('category');

  // Enrollment counts
  const { count: activeEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: completedEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const workforceMetrics = metrics?.filter(m =>
    ['placement', 'employment', 'wage', 'completion'].some(k => m.category?.toLowerCase().includes(k))
  ) ?? [];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'FSSA', href: '/fssa' }, { label: 'IMPACT Outcomes' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">FSSA / IMPACT Program</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Program Outcomes &amp; Impact</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-6">
            Measurable results for FSSA IMPACT participants — credential attainment, job placement, and wage data for Indiana workforce reporting.
          </p>
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 max-w-2xl">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm">
              Enrollment in the FSSA IMPACT program requires eligibility verification and funding approval. Outcomes data reflects completed program cohorts.
            </p>
          </div>
        </div>
      </section>

      {/* Live DB stats */}
      <section className="bg-brand-red-600 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-10 text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">{activeEnrollments ?? '—'}</p>
            <p className="text-red-100 text-sm mt-1">Active Participants</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{completedEnrollments ?? '—'}</p>
            <p className="text-red-100 text-sm mt-1">Program Completions</p>
          </div>
          {PROGRAM_OUTCOMES.slice(0, 2).map((o) => (
            <div key={o.label}>
              <p className="text-3xl font-extrabold text-white">{o.value}</p>
              <p className="text-red-100 text-sm mt-1">{o.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outcome metrics */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Key Outcome Metrics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAM_OUTCOMES.map((o) => {
              const Icon = o.icon;
              return (
                <div key={o.label} className="rounded-xl border border-slate-200 p-6 text-center">
                  <Icon className="w-8 h-8 text-brand-red-500 mx-auto mb-3" />
                  <p className="text-3xl font-extrabold text-slate-900">{o.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{o.label}</p>
                </div>
              );
            })}
          </div>

          {/* DB-driven metrics if available */}
          {workforceMetrics.length > 0 && (
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workforceMetrics.map((m) => (
                <div key={m.id} className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{m.category}</p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {m.metric_value}{m.metric_unit ? ` ${m.metric_unit}` : ''}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{m.metric_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Eligible programs */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">FSSA-Eligible Programs</h2>
          <p className="text-slate-600 mb-8">
            The following programs are approved for FSSA IMPACT funding. Eligibility is determined per participant.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ELIGIBLE_PROGRAMS.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.credential}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
          <div>
            <TrendingUp className="w-8 h-8 text-brand-red-400 mb-3" />
            <h2 className="text-2xl font-bold mb-2">FSSA / IMPACT Enrollment</h2>
            <p className="text-slate-300 max-w-lg">
              Participants must be referred through FSSA or a WorkOne office. Review eligibility requirements before applying.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/fssa"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"
            >
              <Users className="w-4 h-4" /> Eligibility &amp; Requirements
            </Link>
            <Link
              href="/fssa/partnership-request"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
            >
              <ArrowRight className="w-4 h-4" /> Agency Partnership Request
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
