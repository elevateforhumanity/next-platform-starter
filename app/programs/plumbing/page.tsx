import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PLUMBING } from '@/data/programs/plumbing';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';

export const metadata: Metadata = {
  title: PLUMBING.metaTitle,
  description: PLUMBING.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/plumbing' },
};

export default function PlumbingProgramPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative w-full" style={{ height: 'clamp(300px, 45vw, 520px)' }}>
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src={PLUMBING.heroImage}
          alt={PLUMBING.heroImageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw" placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 to-transparent" />
        <div className="absolute bottom-8 left-6 sm:left-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            {PLUMBING.title}
          </h1>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            Install and repair residential and commercial plumbing systems. OSHA 10 + NCCER in 10 weeks.
          </p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{PLUMBING.durationWeeks} Weeks</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{PLUMBING.hoursPerWeekMin}–{PLUMBING.hoursPerWeekMax}</p>
            <p className="text-slate-400 text-sm">Hours / Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white capitalize">{PLUMBING.deliveryMode}</p>
            <p className="text-slate-400 text-sm">Delivery</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{PLUMBING.credentials.length}</p>
            <p className="text-slate-400 text-sm">Credentials</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-3">
            Learn to install and repair residential and commercial plumbing systems in 10 weeks. You&apos;ll master copper soldering, PVC cement joints, PEX crimping, DWV systems, fixture installation, and Indiana Plumbing Code requirements.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            Graduate with OSHA 10-Hour Construction Safety and NCCER Core Curriculum certifications. Plumbers earn a median salary of $59,880/year in the Indianapolis metro area. This program prepares you for immediate employment as a plumber helper or apprentice. Bilingual instruction available.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application. No prior plumbing experience required.' },
              { step: 2, title: 'Enroll', desc: 'Confirm WIOA/WRG funding eligibility through WorkOne or choose self-pay.' },
              { step: 3, title: 'Train', desc: '10 weeks of pipe joining, DWV systems, fixture installation, water heaters, and code compliance.' },
              { step: 4, title: 'Credential', desc: 'Pass OSHA 10-Hour and NCCER Core Curriculum certification exams.' },
              { step: 5, title: 'Employment', desc: 'Career placement into plumber helper, apprentice, and maintenance positions.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
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

      {/* Credentials */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Credentials You Earn</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLUMBING.credentials.map((cred) => (
              <div key={cred.name} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{cred.name}</h3>
                <p className="text-xs text-brand-blue-600 font-medium mb-2">{cred.issuer}</p>
                <p className="text-sm text-slate-600">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding & Payment */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Funding &amp; Payment</h2>
          <FundingInfoBlock
            programName={PLUMBING.title}
            fundingSources={['WIOA', 'Workforce Ready Grant', 'Next Level Jobs']}
            selfPayPrice={5000}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start your plumbing career in 10 weeks.
          </h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            OSHA 10 + NCCER credentials. $60K median salary. Funded for eligible participants.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={PLUMBING.cta.applyHref}
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              Apply Now
            </Link>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Check Eligibility
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {PLUMBING.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-slate-200 overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-900 text-sm flex items-center justify-between">
                  {faq.question}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
