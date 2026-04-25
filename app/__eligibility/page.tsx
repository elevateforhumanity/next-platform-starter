import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import EligibilityPreQualifier from '@/components/enrollment/EligibilityPreQualifier';
import {
  CheckCircle, XCircle, AlertCircle, ArrowRight, Users,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Eligibility | Funded Career Training | Elevate for Humanity',
  description: 'Check your eligibility for WIOA, WRG, and FSSA-funded career training programs at Elevate for Humanity. Most participants qualify for no-cost training.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/eligibility' },
};

const FUNDING_TYPES = [
  {
    name: 'WIOA',
    full: 'Workforce Innovation and Opportunity Act',
    who: 'Unemployed or underemployed adults, dislocated workers, youth 16–24',
    covers: 'Tuition, fees, books, supplies',
    href: '/wioa-eligibility',
  },
  {
    name: 'WRG',
    full: 'Workforce Ready Grant',
    who: 'Indiana residents pursuing high-demand credentials',
    covers: 'Tuition and fees for approved programs',
    href: '/funding/how-it-works',
  },
  {
    name: 'FSSA / SNAP E&T',
    full: 'IMPACT Program',
    who: 'SNAP recipients referred through FSSA or WorkOne',
    covers: 'Training, support services, transportation assistance',
    href: '/fssa',
  },
  {
    name: 'JRI',
    full: 'Job Ready Indy',
    who: 'Marion County residents seeking career advancement',
    covers: 'Training costs for approved programs',
    href: '/funding/how-it-works',
  },
];

const QUICK_CHECKS = [
  { label: 'Are you 18 or older?', positive: true },
  { label: 'Are you a U.S. citizen or eligible non-citizen?', positive: true },
  { label: 'Are you currently unemployed or underemployed?', positive: true },
  { label: 'Do you live in Indiana?', positive: true },
  { label: 'Are you currently enrolled in another funded training program?', positive: false },
];

export default async function EligibilityPage() {
  const db = await getAdminClient();

  // Pull published programs for the eligibility quiz context
  const { data: programs } = await db
    .from('programs')
    .select('id, title, slug, credential_type, short_description')
    .eq('published', true)
    .eq('is_active', true)
    .order('title')
    .limit(12);

  const { count: activeEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Eligibility' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Funded Career Training</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Check Your Eligibility</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-4">
            Most participants qualify for no-cost or low-cost training through WIOA, WRG, or FSSA funding. Find out which programs you're eligible for.
          </p>
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Users className="w-4 h-4 text-brand-red-400" />
            <span>{activeEnrollments ?? 'Hundreds of'} participants currently enrolled in funded programs</span>
          </div>
        </div>
      </section>

      {/* Quick eligibility check */}
      <section className="py-12 px-4 bg-slate-50 border-b">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Eligibility Check</h2>
          <div className="space-y-3">
            {QUICK_CHECKS.map((c) => (
              <div key={c.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                {c.positive
                  ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                <span className="text-sm text-slate-700">{c.label}</span>
                <span className={`ml-auto text-xs font-semibold ${c.positive ? 'text-green-600' : 'text-red-500'}`}>
                  {c.positive ? 'Yes → Good' : 'Yes → May affect eligibility'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Final eligibility is determined by our enrollment team after reviewing your application. This quick check is not a guarantee of funding.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive pre-qualifier */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Full Eligibility Pre-Qualifier</h2>
          <p className="text-slate-600 mb-8">Answer a few questions to see which funding programs you may qualify for.</p>
          <EligibilityPreQualifier />
        </div>
      </section>

      {/* Funding types */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Available Funding Programs</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {FUNDING_TYPES.map((f) => (
              <Link
                key={f.name}
                href={f.href}
                className="block rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-extrabold text-slate-900">{f.name}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-brand-red-600 mb-3">{f.full}</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">Who qualifies: </span>
                    <span className="text-slate-600">{f.who}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Covers: </span>
                    <span className="text-slate-600">{f.covers}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Programs list */}
      {programs && programs.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Eligible Programs</h2>
              <Link href="/programs" className="text-sm font-semibold text-brand-red-600 hover:underline flex items-center gap-1">
                All programs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((p) => (
                <Link
                  key={p.id}
                  href={`/programs/${p.slug}`}
                  className="block rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
                >
                  <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-wide mb-1">
                    {p.credential_type ?? 'Certificate'}
                  </p>
                  <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                  {p.short_description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.short_description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-14 px-4 bg-brand-red-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Ready to Apply?</h2>
          <p className="text-red-100 mb-8">Our enrollment team will confirm your eligibility and connect you with the right funding program.</p>
          <Link href="/apply" className="rounded-lg bg-white px-8 py-3 font-bold text-brand-red-700 hover:bg-red-50 transition">
            Start Your Application
          </Link>
        </div>
      </section>
    </div>
  );
}
