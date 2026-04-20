export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function DiyTaxesPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-3.jpg"
        alt="DIY online tax filing"
        title="DIY Tax Filing — File at Your Own Pace"
        subtitle="Step-by-step online interview. Same accuracy as in-person. E-file in minutes."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Feature grid */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Built for Everyone</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Guided Interview', desc: 'Answer plain-English questions. No tax knowledge required — we translate everything.' },
              { title: 'Real-Time Refund Estimate', desc: 'Watch your refund or balance-due update as you enter information.' },
              { title: 'Secure Cloud Save', desc: 'Save your progress and come back anytime. Your data is encrypted at rest.' },
              { title: 'Review Before You File', desc: 'See a complete summary of your return and confirm every number before e-filing.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What you can file */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What You Can File</h2>
          <ul className="space-y-3">
            {[
              'W-2 income from one or more employers',
              '1099 income and freelance / self-employment earnings',
              'Earned Income Tax Credit (EITC) and Child Tax Credits',
              'Standard and itemized deductions',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section className="bg-brand-blue-900 text-white rounded-2xl p-10 text-center">
          <p className="text-3xl font-black mb-2">Federal: $39 &nbsp;·&nbsp; State: $29</p>
          <p className="text-white/80 text-lg">Maximum refund guaranteed.</p>
        </section>

        {/* CTAs */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/tax-self-prep/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Start Your Return Free
          </Link>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-white border-2 border-brand-blue-900 text-brand-blue-900 hover:bg-slate-50 font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Have a pro do it instead
          </Link>
        </section>
      </main>
    </>
  );
}
