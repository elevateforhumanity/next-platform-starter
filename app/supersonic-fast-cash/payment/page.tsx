import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Payment Options | Supersonic Fast Cash',
};

export default function PaymentPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-1.jpg"
        alt="Payment options for tax preparation"
        title="Payment Options"
        subtitle="Flexible payment options so you can get your taxes done without stress."
      />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">How Payment Works</h2>
          <p className="text-slate-600 leading-relaxed">
            Tax preparation fees are due at the time of service, before your return is submitted to the
            IRS. We do not charge for consultations. Your preparer will give you a clear quote for
            your return before any work begins.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-5">Accepted Payment Methods</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Cash', desc: 'Accepted at all in-person appointments' },
              { label: 'Debit / Credit Card', desc: 'Visa, Mastercard, and Discover accepted' },
              { label: 'Bank Transfer (ACH)', desc: 'Available for pre-approved clients' },
              { label: 'Refund Transfer', desc: 'Deduct our fee from your refund (fees apply)' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="font-bold text-slate-900 mb-1">{label}</p>
                <p className="text-slate-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Pricing Guide</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Pricing depends on your situation. Below are typical ranges. Your exact quote will be
            provided by your preparer before work begins.
          </p>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {[
              { type: 'Simple return (W-2 only)', price: 'Starting at $75' },
              { type: 'With EITC or Child Tax Credit', price: 'Starting at $95' },
              { type: 'Self-employed / Schedule C', price: 'Starting at $150' },
              { type: 'Multiple states', price: '+$40 per additional state' },
              { type: 'Amended return (1040-X)', price: 'Starting at $100' },
            ].map(({ type, price }) => (
              <div key={type} className="flex items-center justify-between px-6 py-4">
                <span className="text-slate-700">{type}</span>
                <span className="font-bold text-brand-red-600">{price}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            Start Your Return
          </Link>
        </div>
      </div>
    </>
  );
}
