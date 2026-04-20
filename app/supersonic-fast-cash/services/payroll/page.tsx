export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function PayrollPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-5.jpg"
        alt="Full-service payroll processing for small businesses"
        title="Full-Service Payroll Processing"
        subtitle="We run payroll so you can run your business. Direct deposit, tax filings, W-2s — handled."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* What's included */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What&rsquo;s Included</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Direct Deposit Processing', desc: 'On-time payroll delivered directly to your employees\' bank accounts.' },
              { title: 'Federal & State Tax Filings', desc: 'We file Form 941, Form 940, and all required state payroll tax returns on your behalf.' },
              { title: 'W-2 & 1099 Preparation', desc: 'Year-end forms prepared, filed with the IRS, and delivered to employees/contractors.' },
              { title: 'New Hire Reporting', desc: 'We submit federally required new hire reports to the appropriate state agencies.' },
              { title: 'Garnishment Processing', desc: 'Child support, creditor garnishments, and other withholding orders handled accurately.' },
              { title: 'Year-End Compliance', desc: 'Annual reconciliation, W-3 filing, and records package so you\'re always audit-ready.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-brand-blue-900 text-white rounded-2xl p-10 text-center">
          <p className="text-3xl font-black mb-2">Starting at $49/month</p>
          <p className="text-white/80 text-lg">Plus $6 per employee per pay period</p>
        </section>

        {/* Who uses it */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Who Uses Our Payroll Service</h2>
          <p className="text-slate-600 mb-4">Businesses with 1–50 employees across our service states:</p>
          <div className="flex flex-wrap gap-3">
            {['Indiana', 'Illinois', 'Ohio', 'Tennessee', 'Texas'].map((state) => (
              <span key={state} className="bg-white border border-slate-200 rounded-full px-5 py-2 text-slate-700 font-semibold text-sm shadow-sm">
                {state}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/supersonic-fast-cash/contact"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Get Payroll Quote
          </Link>
        </section>
      </main>
    </>
  );
}
