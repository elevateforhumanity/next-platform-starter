import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Payment Cancelled | Supersonic Fast Cash',
};

export default function PaymentCancelPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-1.jpg"
        alt="Payment cancelled"
        title="Payment Cancelled"
        subtitle="No worries — your payment was not processed."
      />

      <div className="max-w-2xl mx-auto px-4 py-14 text-center space-y-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-3">Your Payment Was Not Completed</h2>
          <p className="text-slate-600 leading-relaxed">
            No charges were made to your account. If you experienced a technical issue or changed your
            mind, you can return to the start of the process and try again. If you need help, our team
            is ready to assist you.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Return to Start
          </Link>
          <a
            href="tel:3173143757"
            className="inline-block border-2 border-slate-300 text-slate-700 hover:border-brand-red-600 hover:text-brand-red-600 font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Call for Help
          </a>
        </div>
      </div>
    </>
  );
}
