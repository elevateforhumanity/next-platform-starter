'use client';

import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { BnplCheckoutWidget } from '@/components/payments/BnplCheckoutWidget';
import { TUITION_CENTS, TUITION_DOLLARS } from '@/lib/barber/pricing';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function BnplPageClient() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();

  // Optional context passed from the apply form via query params
  const email = searchParams.get('email') ?? '';
  const name = searchParams.get('name') ?? '';
  const phone = searchParams.get('phone') ?? '';
  const applicationId = searchParams.get('application_id') ?? '';

  const checkoutPayload = {
    customer_email: email,
    customer_name: name,
    customer_phone: phone,
    application_id: applicationId || null,
  };

  function handleSuccess(sessionId: string) {
    router.push(
      `/programs/barber-apprenticeship/apply/success?session_id=${sessionId}`,
    );
  }

  function handleCancel() {
    router.back();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-0.5">
              Barber Apprenticeship
            </p>
            <h1 className="text-slate-900 font-bold text-lg">Pay with BNPL</h1>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Shield className="w-3.5 h-3.5" />
            Secured by Stripe
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Back link */}
        <Link
          href="/programs/barber-apprenticeship/apply"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to application
        </Link>

        {/* Amount summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Program Tuition</p>
          <p className="text-3xl font-extrabold text-slate-900">
            ${TUITION_DOLLARS.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Barber Apprenticeship — full program. Your BNPL provider splits this into installments.
          </p>
        </div>

        {/* BNPL widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">
            Choose a Buy Now, Pay Later provider
          </p>
          <BnplCheckoutWidget
            amountCents={TUITION_CENTS}
            checkoutEndpoint="/api/barber/checkout/embedded"
            checkoutPayload={checkoutPayload}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>

        {/* Other payment options */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-400">Prefer a different payment method?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/programs/barber-apprenticeship/payment-setup"
              className="text-brand-blue-600 hover:underline font-medium"
            >
              Weekly payment plan
            </Link>
            <Link
              href="/programs/barber-apprenticeship/apply?payment=full"
              className="text-brand-blue-600 hover:underline font-medium"
            >
              Pay in full
            </Link>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs pt-2">
          <Shield className="w-3.5 h-3.5" />
          256-bit SSL · PCI DSS compliant · Powered by Stripe
        </div>
      </div>
    </div>
  );
}
