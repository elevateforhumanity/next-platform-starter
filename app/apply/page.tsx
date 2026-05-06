import type { Metadata } from 'next';
import Link from 'next/link';
import IntakeFormInner from './IntakeFormInner';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Apply | Check Eligibility for Funded Training | Elevate for Humanity',
  description:
    'Check eligibility for WIOA, WRG, and FSSA IMPACT-funded training in healthcare, trades, technology, and business. Many programs are no cost to eligible Indiana residents.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Audience switcher */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-slate-900">Applying as:</span>
          <span className="font-bold text-brand-red-600">Student / Participant</span>
          <span className="text-slate-300">|</span>
          <Link href="/onboarding/employer" className="text-slate-500 hover:text-slate-800 transition-colors">Employer</Link>
          <Link href="/apply/program-holder" className="text-slate-500 hover:text-slate-800 transition-colors">Training Provider</Link>
          <Link href="/partners/apply" className="text-slate-500 hover:text-slate-800 transition-colors">Agency / Partner</Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">
            Funding &amp; Apprenticeship Intake
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Check Your Eligibility
          </h1>
          <p className="text-slate-300 text-base max-w-xl">
            Takes 3–5 minutes. We screen for WIOA, WRG, FSSA IMPACT, and Job Ready Indy funding.
            Many programs are no cost to eligible Indiana residents.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-10">
        <div className="max-w-2xl mx-auto px-4">
          <IntakeFormInner />
        </div>
      </section>
    </div>
  );
}
