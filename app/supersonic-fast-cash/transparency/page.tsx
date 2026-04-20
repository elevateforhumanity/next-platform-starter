export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

const pricingItems = [
  { label: 'Simple W-2 Return', price: 'Starting at $75' },
  { label: 'W-2 + State Return', price: 'Starting at $99' },
  { label: 'Self-Employed / Schedule C', price: 'Starting at $149' },
  { label: 'Rental Income / Schedule E', price: 'Starting at $149' },
  { label: 'Multi-State Returns', price: 'Starting at $50 per additional state' },
  { label: 'Amended Return (1040-X)', price: 'Starting at $99' },
];

export default function TransparencyPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-tax-cert.jpg"
        alt="Supersonic Fast Cash transparency and credentials"
        title="Our Commitment to Transparency"
        subtitle="Honest pricing, clear processes, and no surprises."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Pricing transparency */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Transparent Pricing — No Hidden Fees</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            You will always know your total cost before we e-file your return. We never add fees at the end
            of your appointment without your prior agreement. All prices below are starting rates — your
            preparer will confirm the exact fee after reviewing your documents.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {pricingItems.map(({ label, price }) => (
              <div key={label} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
                <span className="font-medium text-slate-900">{label}</span>
                <span className="text-brand-red-600 font-bold text-sm">{price}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Audit protection is included at no additional charge with every return we prepare.
          </p>
        </section>

        {/* Preparer credentials */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Preparer Credentials</h2>
          <ul className="space-y-4">
            {[
              'Every return is prepared and signed by a PTIN-holder — as required by the IRS for all paid preparers.',
              'Our principal preparer holds Enrolled Agent (EA) status — the highest credential awarded by the IRS.',
              'PTIN numbers are available on request. You may also verify any preparer on the IRS PTIN registry at irs.gov.',
              'We complete continuing education every year to maintain our credentials and stay current on tax law changes.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* IRS authorization */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">IRS Authorized e-File Provider</h2>
          <p className="text-slate-600 leading-relaxed">
            Supersonic Fast Cash is an authorized IRS e-file provider. Your return is transmitted directly
            and securely to the IRS — not mailed, not held, not delayed. You will receive an IRS
            acknowledgment confirming acceptance typically within 24–48 hours of filing.
          </p>
        </section>

        {/* Refund advance terms */}
        <section className="bg-brand-blue-900 text-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Refund Advance — Full Terms</h2>
          <ul className="space-y-3">
            {[
              'Advances up to $7,500 — exact amount depends on your expected refund.',
              'Zero interest — you repay only what you borrowed, nothing more.',
              'Zero fees — no origination fee, no processing fee, no service charge.',
              'Funded the same business day after IRS acceptance of your return.',
              'Repaid automatically from your IRS refund when it arrives — nothing for you to manage.',
              'Subject to approval and IRS acceptance of your e-filed return.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-white flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-blue-100">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Contact and complaints */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Information & Complaint Process</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            If you have a concern about a return we prepared, a fee we charged, or any aspect of our
            service, please contact us directly first — we resolve the vast majority of issues within
            one business day.
          </p>
          <ul className="space-y-3 mb-6">
            {[
              'Phone: (317) 314-3757 — Monday through Saturday, 9 AM – 7 PM ET',
              'Email: support@supersonicfastcash.com',
              'In person: Indianapolis, IN — walk-ins welcome during business hours',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500">
            If a complaint cannot be resolved directly, you may contact the{' '}
            <span className="font-medium text-slate-700">IRS Return Preparer Office</span> at 1-855-472-5540
            or the Indiana Department of Revenue for state-specific matters.
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
