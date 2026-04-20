export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function BookkeepingPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/finance-accounting.jpg"
        alt="Small business bookkeeping services"
        title="Small Business Bookkeeping"
        subtitle="Monthly bookkeeping so you always know where your money is — and owe less at tax time."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Services list */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What We Handle</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Income and expense categorization',
              'Bank and credit card reconciliation',
              'Monthly financial reports',
              'Payroll processing coordination',
              'Tax-ready records year-round',
              'QuickBooks or spreadsheet-based',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-brand-blue-900 text-white rounded-2xl p-10 text-center">
          <p className="text-3xl font-black mb-2">Plans starting at $199/month</p>
          <p className="text-white/80 text-lg">No contracts. Cancel anytime.</p>
        </section>

        {/* Who it's for */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Who It&rsquo;s For</h2>
          <ul className="space-y-3">
            {[
              'Sole proprietors and independent contractors',
              'LLCs and S-corporations',
              'Side businesses with $50K+ annual revenue',
              'Any business owner who wants clean, tax-ready books',
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
            href="/supersonic-fast-cash/contact"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Request a Quote
          </Link>
        </section>
      </main>
    </>
  );
}
