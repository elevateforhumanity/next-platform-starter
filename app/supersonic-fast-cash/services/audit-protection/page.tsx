export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function AuditProtectionPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-tax-cert.jpg"
        alt="IRS audit protection and representation"
        title="Audit Protection — Full IRS Representation"
        subtitle="Every return we prepare includes one full year of audit support at no extra cost."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* What's included */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What&rsquo;s Included</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'IRS Correspondence Handled', desc: 'We read every IRS letter and respond on your behalf so you never have to deal with the IRS directly.' },
              { title: 'In-Person Representation at Audit', desc: 'A qualified preparer accompanies you — or represents you — at any IRS audit appointment.' },
              { title: 'Response Letters Drafted', desc: 'Professional written responses to CP notices, examination requests, and other IRS communications.' },
              { title: 'No Hourly Fees', desc: 'Audit protection is bundled with every return. You will never receive a bill for representation services.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why audits happen */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Common Audit Triggers</h2>
          <ul className="space-y-3">
            {[
              'Unusually high deductions relative to income',
              'Round-number figures on Schedule C or deductions',
              'Home office deduction claimed on a primary residence',
              'Business losses reported multiple years in a row',
              'Large charitable donations without documentation',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Stat callout */}
        <section className="bg-brand-blue-900 text-white rounded-2xl p-10 text-center">
          <p className="text-xl font-semibold leading-relaxed max-w-2xl mx-auto">
            &ldquo;Less than 1% of returns are audited — but when yours is, you won&rsquo;t face it alone.&rdquo;
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            File With Us
          </Link>
        </section>
      </main>
    </>
  );
}
