export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';

export const metadata: Metadata = {
  title: NAIL_TECH.metaTitle,
  description: NAIL_TECH.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship' },
};

export default function NailTechnicianApprenticeshipPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative w-full" style={{ height: 'clamp(300px, 45vw, 520px)' }}>
        <Image
          src={NAIL_TECH.heroImage}
          alt={NAIL_TECH.heroImageAlt}
          fill priority
          className="object-cover"
          sizes="100vw" placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-slate-800/40 to-transparent" />
        <div className="absolute bottom-8 left-6 sm:left-10 max-w-2xl">
          <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
            {NAIL_TECH.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            {NAIL_TECH.title}
          </h1>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            {NAIL_TECH.subtitle}
          </p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">5 Months</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">600 Hours</p>
            <p className="text-slate-400 text-sm">Supervised Training</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Earn & Learn</p>
            <p className="text-slate-400 text-sm">Paid Apprenticeship</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{NAIL_TECH.credentials.length}</p>
            <p className="text-slate-400 text-sm">Credentials</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-3">
            This DOL-registered apprenticeship lets you earn your Indiana nail technician license
            while getting paid. You complete the 600 hours required by Indiana for nail technology
            licensure through supervised training in a licensed partner salon — not a classroom.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            Apprentices are employed by a host salon and receive wages throughout training. Upon
            completing 600 hours, you sit for the Indiana nail technician theory and practical
            exams administered by IPLA and receive your state license.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application. Must be 16+ with a high school diploma or GED (or actively pursuing).' },
              { step: 2, title: 'Match with a Host Salon', desc: 'We match you with a licensed partner nail salon in Indianapolis. Complete enrollment and background check.' },
              { step: 3, title: 'Train & Earn', desc: '600 hours of supervised training — manicures, pedicures, gel, acrylics, nail art, and client management. You are a paid employee.' },
              { step: 4, title: 'Get Licensed', desc: 'Pass the Indiana nail technician theory and practical exams administered by IPLA.' },
              { step: 5, title: 'Launch Your Career', desc: 'Begin your career as a licensed nail technician. Many apprentices stay at their host salon.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-slate-600 text-sm mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Training Phases */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Training Phases</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {NAIL_TECH.trainingPhases?.map((phase) => (
              <div key={phase.phase} className="rounded-xl border border-slate-200 p-5">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Phase {phase.phase}</span>
                <h3 className="font-bold text-slate-900 mt-1 mb-1">{phase.title}</h3>
                <p className="text-xs text-slate-500 mb-3">{phase.weeks}</p>
                <p className="text-sm text-slate-600 mb-3">{phase.focus}</p>
                <ul className="space-y-1">
                  {phase.labCompetencies.map((c) => (
                    <li key={c} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <span className="text-purple-500 mt-0.5">✓</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Credentials You Earn</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {NAIL_TECH.credentials.map((cred) => (
              <div key={cred.name} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{cred.name}</h3>
                <p className="text-xs text-purple-600 font-medium mb-2">{cred.issuer}</p>
                <p className="text-sm text-slate-600">{cred.description}</p>
                <p className="text-xs text-slate-400 mt-2">Valid: {cred.validity}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Pathway */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Career Pathway</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NAIL_TECH.careerPathway.map((step, i) => (
              <div key={step.title} className="relative rounded-xl border border-slate-200 p-5">
                <span className="absolute -top-3 left-4 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {i + 1}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-500 mb-1">{step.timeframe}</p>
                <p className="text-xs font-semibold text-purple-700">{step.salaryRange}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Salary data: {NAIL_TECH.laborMarket?.source}, {NAIL_TECH.laborMarket?.sourceYear}. {NAIL_TECH.laborMarket?.region}.
          </p>
        </div>
      </section>

      {/* Funding */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Funding &amp; Payment</h2>
          <FundingInfoBlock
            programName={NAIL_TECH.title}
            fundingSources={['FSSA IMPACT', 'Employer-Sponsored Apprenticeship']}
            selfPayPrice={5000}
          />
          <p className="text-sm text-slate-500 mt-4">{NAIL_TECH.paymentTerms}</p>
        </div>
      </section>

      {/* Host Salons CTA */}
      <section className="py-10 px-6 bg-purple-50 border-y border-purple-100">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-purple-900">Own a nail salon?</p>
            <p className="text-sm text-purple-700 mt-0.5">
              Become a host salon and train the next generation of licensed nail technicians.
              OJT wage reimbursement available.
            </p>
          </div>
          <Link
            href="/programs/nail-technician-apprenticeship/host-shops"
            className="flex-shrink-0 bg-purple-700 hover:bg-purple-800 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Become a Host Salon →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start earning while you learn.</h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            Paid apprenticeship. Indiana nail technician license upon completion. Apply today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/programs/nail-technician-apprenticeship/apply"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/apply?program=nail-technician-apprenticeship&type=inquiry"
              className="border border-slate-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Request Info
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {NAIL_TECH.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-slate-200 overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-900 text-sm flex items-center justify-between">
                  {faq.question}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
