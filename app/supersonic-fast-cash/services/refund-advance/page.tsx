export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';
import SfcTrustBar from '@/components/supersonic/SfcTrustBar';

export default function RefundAdvancePage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-2.jpg"
        alt="Tax refund advance — same day cash"
        title="Same-Day Refund Advance — Up to $7,500"
        subtitle="Get your tax refund today — not in 3 weeks. Zero interest, zero fees when you file with us."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Advance tiers */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Choose Your Advance Amount</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { amount: '$2,500', label: 'Available same day', highlight: false },
              { amount: '$5,000', label: 'Most popular', highlight: true },
              { amount: '$7,500', label: 'Maximum advance', highlight: false },
            ].map(({ amount, label, highlight }) => (
              <div
                key={amount}
                className={`rounded-2xl border-2 p-8 text-center shadow-sm ${highlight ? 'border-brand-red-600 bg-brand-red-600 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                <p className={`text-5xl font-black mb-2 ${highlight ? 'text-white' : 'text-brand-red-600'}`}>{amount}</p>
                <p className={`text-sm font-semibold uppercase tracking-wide ${highlight ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'File Your Return', desc: 'Come in or file remotely with one of our PTIN-certified preparers. We handle all the paperwork.' },
              { step: '2', title: 'Get Approved', desc: 'We submit your return electronically. Advance approval typically takes minutes.' },
              { step: '3', title: 'Money in Your Account', desc: 'Funds deposited to your bank account the same business day after IRS acceptance.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-blue-900 text-white font-black text-lg flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Eligibility Requirements</h2>
          <ul className="space-y-3">
            {[
              'Must file your return with Supersonic Fast Cash',
              'Expected refund must be $1,000 or more',
              'Valid government-issued photo ID required',
              'Direct deposit bank account required',
              'No open bankruptcies',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Start Your Return to Qualify
          </Link>
        </section>
      </main>

      <SfcTrustBar />
    </>
  );
}
