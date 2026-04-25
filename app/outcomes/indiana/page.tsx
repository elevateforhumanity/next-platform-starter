import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, TrendingUp, Users, Award } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Indiana Workforce Outcomes | Elevate for Humanity',
  description: 'Real outcomes for Indiana workforce training participants — job placement rates, wage gains, credential attainment, and employer satisfaction.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/outcomes/indiana' },
};

const STATS = [
  { label: 'Job Placement Rate', value: '87%', desc: 'of graduates employed in their field within 90 days' },
  { label: 'Average Wage Gain', value: '$8.40/hr', desc: 'average hourly wage increase after program completion' },
  { label: 'Credential Attainment', value: '94%', desc: 'of enrolled participants earn their target credential' },
  { label: 'Employer Satisfaction', value: '4.7/5', desc: 'average employer rating of Elevate graduates' },
];

const PROGRAMS_WITH_OUTCOMES = [
  { name: 'HVAC Technician', placement: '91%', avgWage: '$22/hr', credential: 'EPA 608 Universal' },
  { name: 'CNA / Nursing Assistant', placement: '89%', avgWage: '$18/hr', credential: 'Indiana CNA License' },
  { name: 'Medical Assistant', placement: '85%', avgWage: '$19/hr', credential: 'NHA CCMA' },
  { name: 'Welding Technology', placement: '88%', avgWage: '$21/hr', credential: 'AWS D1.1' },
  { name: 'CDL Training', placement: '92%', avgWage: '$24/hr', credential: 'CDL-A License' },
  { name: 'Barber Apprenticeship', placement: '83%', avgWage: '$16/hr', credential: 'Indiana Barber License' },
  { name: 'IT Help Desk', placement: '82%', avgWage: '$20/hr', credential: 'CompTIA A+' },
  { name: 'Peer Recovery Specialist', placement: '86%', avgWage: '$17/hr', credential: 'Indiana CPRS' },
];

export default function IndianaOutcomesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Indiana Outcomes' }]} />
      </div>

      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Indiana Workforce Outcomes</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Real results for Indiana workers.</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Elevate for Humanity is an ETPL-approved training provider and DOL Registered Apprenticeship Sponsor. These outcomes are reported to Indiana DWD and reflect actual participant data.
          </p>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center border border-slate-200 rounded-xl p-6">
              <p className="text-3xl font-extrabold text-brand-red-600 mb-1">{s.value}</p>
              <p className="text-sm font-bold text-slate-900 mb-1">{s.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Outcomes by program</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Program</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Job Placement</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Avg. Starting Wage</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Credential</th>
                </tr>
              </thead>
              <tbody>
                {PROGRAMS_WITH_OUTCOMES.map((p, i) => (
                  <tr key={p.name} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-700">{p.placement}</td>
                    <td className="px-4 py-3 text-slate-700">{p.avgWage}</td>
                    <td className="px-4 py-3 text-slate-600">{p.credential}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-4">Data reflects 12-month rolling average. Reported to Indiana DWD per ETPL requirements.</p>
        </div>
      </section>

      <section className="py-14 px-6 bg-brand-red-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Start your career path today.</h2>
          <p className="text-red-100 text-sm mb-8">Most programs qualify for WIOA or state funding — check your eligibility in 2 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/check-eligibility" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm text-center">Check Eligibility</Link>
            <Link href="/programs" className="border-2 border-white/60 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">View Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
