import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

const serviceCards = [
  {
    title: 'Tax Preparation',
    desc: 'PTIN-certified preparers handle W-2, 1099, self-employed, and complex returns. In-person and remote available.',
    href: '/supersonic-fast-cash/services/tax-preparation',
  },
  {
    title: 'Refund Advance',
    desc: 'Receive up to $7,500 the same day your return is accepted by the IRS — zero interest, zero fees.',
    href: '/supersonic-fast-cash/services/refund-advance',
  },
  {
    title: 'DIY Tax Filing',
    desc: 'Guided online interview walks you through your federal and state return at your own pace.',
    href: '/supersonic-fast-cash/diy-taxes',
  },
  {
    title: 'Audit Protection',
    desc: 'One full year of IRS correspondence support and in-person representation included with every filing.',
    href: '/supersonic-fast-cash/services/audit-protection',
  },
  {
    title: 'Bookkeeping',
    desc: 'Monthly categorization, reconciliation, and financial statements for sole proprietors and small businesses.',
    href: '/supersonic-fast-cash/services/bookkeeping',
  },
  {
    title: 'Payroll',
    desc: 'Weekly or bi-weekly payroll processing, direct deposit, and quarterly filings for small business owners.',
    href: '/supersonic-fast-cash/services/payroll',
  },
];

export default function ServicesPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-1.jpg"
        alt="Tax and financial services at Supersonic Fast Cash"
        title="Tax & Financial Services"
        subtitle="Everything from W-2 filing to bookkeeping and payroll — for individuals and small businesses."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Service cards */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What We Offer</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceCards.map(({ title, desc, href }) => (
              <Link
                key={title}
                href={href}
                className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-brand-red-500 transition-all"
              >
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-brand-red-600 transition-colors">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                <span className="mt-4 inline-block text-brand-red-600 text-sm font-semibold">Learn more →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Why us */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Supersonic Fast Cash</h2>
          <ul className="space-y-4">
            {[
              'Enrolled Agent (EA) on staff — the highest credential the IRS awards to tax professionals',
              'PTIN-certified preparers on every return — required by IRS for paid preparers',
              'Authorized IRS e-file provider — your return is transmitted securely and directly',
              'Transparent, flat-rate pricing — no surprises at the end of your appointment',
              'In-person and fully remote service — you choose how you work with us',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-brand-blue-900 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Get Started Today</h2>
          <p className="text-blue-200 mb-8">File with confidence — PTIN-certified, IRS-authorized, no hidden fees.</p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors"
          >
            Start My Return
          </Link>
        </section>

      </main>
    </>
  );
}
