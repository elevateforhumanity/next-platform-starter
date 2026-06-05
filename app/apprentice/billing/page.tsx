import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import BillingCard, { type BillingSummary } from '@/components/learner/BillingCard';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { APPRENTICE_PORTAL_CONFIGS } from '@/components/portal/ApprenticePortalShell';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Billing | Apprentice Portal',
  description: 'Update your payment method and view tuition status.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/billing');
  }

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  const portalPath =
    (programSlug && APPRENTICE_PORTAL_CONFIGS[programSlug]?.portalPath) || '/apprentice';

  const hdrs = await headers();
  const billingUpdated = hdrs.get('x-pathname')?.includes('billing=updated');

  const db = await getAdminClient();

  if (programSlug === 'barber-apprenticeship' && db) {
    const { data: sub } = await db
      .from('barber_subscriptions')
      .select(
        'payment_status, weekly_payment_cents, remaining_balance, full_tuition_amount, amount_paid_at_checkout, next_payment_date, fully_paid, setup_fee_paid, stripe_customer_id, stripe_subscription_id',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return (
        <BillingFallback
          portalPath={portalPath}
          message="No barber tuition account was found. Contact support if you recently enrolled."
        />
      );
    }

    const billing: BillingSummary = {
      program: 'barber',
      paymentStatus: sub.payment_status ?? 'pending_payment_method',
      weeklyPaymentCents: sub.weekly_payment_cents,
      remainingBalance: sub.remaining_balance,
      fullTuitionAmount: sub.full_tuition_amount,
      amountPaidAtCheckout: sub.amount_paid_at_checkout,
      nextPaymentDate: sub.next_payment_date,
      fullyPaid: sub.fully_paid ?? false,
      setupFeePaid: sub.setup_fee_paid ?? false,
    };

    const needsPaymentMethod =
      !sub.fully_paid &&
      !sub.stripe_subscription_id &&
      !sub.setup_fee_paid;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={portalPath}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {billingUpdated && (
          <div className="rounded-lg border border-brand-green-200 bg-brand-green-50 p-4 text-sm text-brand-green-800">
            Payment method updated. Weekly tuition will process on your next billing date.
          </div>
        )}

        {needsPaymentMethod && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Payment method required</p>
              <p>
                Add a debit or credit card below to stay enrolled. Without a card on file, your
                apprenticeship access will pause and OJT hours will stop counting.
              </p>
            </div>
          </div>
        )}

        <BillingCard billing={billing} />

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">Tuition policy</p>
          <p>
            Weekly barber apprenticeship tuition is billed automatically. You can update your
            payment method here — self-service subscription cancellation is not available in the
            student portal.
          </p>
          <p>
            If you are behind on payments, update your card immediately. Missed payments trigger a
            grace period, then suspension of clock-in and hour logging until the balance is
            current.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BillingFallback
      portalPath={portalPath}
      message="Billing for your program is managed through your enrollment advisor. Contact support for payment questions."
    />
  );
}

function BillingFallback({ portalPath, message }: { portalPath: string; message: string }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-slate-600 mb-6">{message}</p>
      <Link
        href={portalPath}
        className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
