export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Tax Information & Resources | Supersonic Fast Cash',
};

const keyDates = [
  { date: 'January 27', event: 'IRS begins accepting e-filed returns' },
  { date: 'January 31', event: 'Employers must send W-2s to employees' },
  { date: 'April 15', event: 'Federal income tax filing deadline' },
  { date: 'October 15', event: 'Extended filing deadline (if extension filed by April 15)' },
];

const taxTips = [
  'Keep all receipts and records throughout the year — not just at tax time',
  'File early to reduce the risk of tax identity fraud',
  'Use direct deposit to receive your refund up to 5 days faster than a paper check',
  'Check your eligibility for the Earned Income Tax Credit (EITC) — it can be worth up to $7,430',
  'If you can\'t file by April 15, file for an extension — but remember it does not extend time to pay',
];

const irsResources = [
  {
    label: 'Where\'s My Refund',
    href: 'https://www.irs.gov/refunds',
    desc: 'Track the status of your federal refund at irs.gov/refunds',
  },
  {
    label: 'IRS Free File',
    href: 'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free',
    desc: 'Free federal tax preparation for eligible taxpayers (income limits apply)',
  },
  {
    label: 'IRS Identity Protection',
    href: 'https://www.irs.gov/identity-theft-fraud-scams/identity-protection',
    desc: 'Protect yourself from tax-related identity theft and IRS impersonation scams',
  },
];

export default function TaxInformationPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-9.jpg"
        alt="Tax information and resources"
        title="Tax Information & Resources"
        subtitle="Stay informed with the latest IRS updates, deadlines, and tax tips."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">2024 Key Tax Dates</h2>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {keyDates.map(({ date, event }) => (
              <div key={date} className="flex items-center gap-5 px-6 py-4">
                <span className="text-brand-red-600 font-black text-sm w-28 flex-shrink-0">{date}</span>
                <span className="text-slate-700">{event}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">5 Tax Tips to Know</h2>
          <ul className="space-y-3">
            {taxTips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-slate-600">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">IRS Resources</h2>
          <div className="space-y-4">
            {irsResources.map(({ label, href, desc }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-slate-200 hover:border-brand-red-600 rounded-xl p-5 transition-colors group"
              >
                <p className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors mb-1">
                  {label} ↗
                </p>
                <p className="text-slate-500 text-sm">{desc}</p>
              </a>
            ))}
          </div>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            File With Us
          </Link>
        </div>
      </div>
    </>
  );
}
