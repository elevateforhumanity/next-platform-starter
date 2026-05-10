import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BarChart2, CheckCircle, Users, BookOpen, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Impact Methodology | Elevate for Humanity',
  description:
    'How Elevate for Humanity measures workforce outcomes — enrollment, completion, credential attainment, and employment placement.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/impact/methodology' },
};

const METRICS = [
  {
    Icon: Users,
    title: 'Enrollment',
    description:
      'Total learners who have started at least one program module. Counted from program_enrollments at status active or later.',
  },
  {
    Icon: BookOpen,
    title: 'Completion',
    description:
      'Learners who have passed all required checkpoints and submitted all required labs for a program. Counted from program_enrollments at status completed.',
  },
  {
    Icon: Award,
    title: 'Credential Attainment',
    description:
      'Certificates issued after a learner passes the final exam and all module checkpoints. Sourced from program_completion_certificates.',
  },
  {
    Icon: BarChart2,
    title: 'Employment Placement',
    description:
      'Graduates who report employment in their trained field within 90 days of credential issuance. Self-reported via follow-up survey.',
  },
];

const PRINCIPLES = [
  'Outcomes are counted at the individual learner level — not seat-hours or page views.',
  'Completion requires passing all checkpoints, not just finishing lessons.',
  'Credential data is sourced directly from our LMS database, not self-reported.',
  'Employment data is self-reported and may undercount actual placement rates.',
  'All figures are updated hourly from live program data.',
];

export default function ImpactMethodologyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/impact"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Impact
          </Link>
          <h1 className="text-4xl font-bold mb-4">Impact Methodology</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            How we define, measure, and report workforce outcomes across all Elevate for Humanity
            programs.
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">What We Measure</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {METRICS.map(({ Icon, title, description }) => (
              <div key={title} className="border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-red-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-red-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Counting Principles</h2>
          <ul className="space-y-4">
            {PRINCIPLES.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-red-600 mt-0.5 shrink-0" />
                <span className="text-slate-700">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Data sources */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Sources</h2>
          <p className="text-slate-600 mb-6">
            All enrollment, completion, and credential figures are pulled directly from the Elevate
            LMS database (Supabase). Employment placement figures are collected via a 90-day
            follow-up survey sent to all credential holders.
          </p>
          <p className="text-slate-600">
            Questions about our methodology?{' '}
            <Link href="/contact" className="text-brand-red-600 underline hover:text-brand-red-700">
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
