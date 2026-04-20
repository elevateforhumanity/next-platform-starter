export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';
import SfcTrustBar from '@/components/supersonic/SfcTrustBar';

const proFeatures = [
  'In-person or remote',
  'Refund advance up to $7,500',
  'All forms included',
  '1-year audit support',
];

const diyFeatures = [
  'Step-by-step interview',
  'Real-time refund estimate',
  'Secure cloud save',
  'E-file when ready',
];

const docChecklist = [
  'Government-issued ID',
  'Social Security cards (for you, spouse, dependents)',
  'All W-2 and 1099 forms',
  'Bank account for direct deposit',
  "Last year's tax return (if available)",
];

export default function StartPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-5.jpg"
        alt="Client and tax preparer reviewing documents at Supersonic Fast Cash"
        title="Start Your Tax Return"
        subtitle="Two ways to file. Both are fast, secure, and backed by our PTIN-certified team."
      />

      {/* Two-option cards */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pro prep card */}
            <div className="rounded-2xl border-2 border-brand-red-600 p-8 flex flex-col relative">
              <span className="absolute -top-3.5 left-6 bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Recommended
              </span>
              <h2 className="text-xl font-black text-slate-900 mb-2">Have Us Prepare It</h2>
              <p className="text-slate-600 mb-6">
                Let a PTIN-certified preparer handle everything.
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/supersonic-fast-cash/book-appointment"
                className="block text-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Book Appointment
              </Link>
            </div>

            {/* DIY card */}
            <div className="rounded-2xl border border-slate-200 p-8 flex flex-col">
              <h2 className="text-xl font-black text-slate-900 mb-2">File It Yourself</h2>
              <p className="text-slate-600 mb-6">
                Guided interview. Same accuracy. Your pace.
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {diyFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/tax-self-prep/start"
                className="block text-center border-2 border-brand-blue-900 text-brand-blue-900 hover:bg-brand-blue-900 hover:text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Start DIY Filing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Document checklist */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">What to Have Ready</h2>
          <p className="text-slate-600 text-center mb-8">
            Gather these before your appointment to speed up your filing.
          </p>
          <ul className="space-y-4">
            {docChecklist.map((item) => (
              <li key={item} className="flex items-center gap-4 bg-white rounded-lg border border-slate-200 px-5 py-4">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact strip */}
      <section className="py-14 bg-brand-blue-900">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-white text-lg mb-6">
            Questions? Call us at{' '}
            <a href="tel:+13173143757" className="font-bold underline underline-offset-2 hover:text-blue-200 transition-colors">
              (317) 314-3757
            </a>{' '}
            or start online now.
          </p>
          <Link
            href="/supersonic-fast-cash/book-appointment"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Book Appointment
          </Link>
        </div>
      </section>

      <SfcTrustBar showEstimateDisclaimer={false} />
    </>
  );
}
