import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Payment Received | Supersonic Fast Cash',
};

export default function PaymentSuccessPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Payment received"
        title="Payment Received"
        subtitle="Thank you — your payment has been processed successfully."
      />

      <div className="max-w-2xl mx-auto px-4 py-14 text-center space-y-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <p className="text-5xl mb-4">✓</p>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Payment Confirmed</h2>
          <p className="text-slate-600 leading-relaxed">
            Your payment has been received. Your preparer will finalize your return and send you a
            confirmation once your tax return has been submitted to the IRS. Typically this happens
            within 1 business day of your appointment.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-slate-600">Questions? Contact us any time.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:3173143757"
              className="inline-block border-2 border-brand-red-600 text-brand-red-600 hover:bg-brand-red-600 hover:text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Call (317) 314-3757
            </a>
            <Link
              href="/supersonic-fast-cash"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
