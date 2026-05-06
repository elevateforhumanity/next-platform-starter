'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Shield, CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { TUITION_DOLLARS, MIN_SETUP_FEE_CENTS } from '@/lib/barber/pricing';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Inner form ────────────────────────────────────────────────────────────────

function PaymentSetupForm({ weeklyAmount }: { weeklyAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/programs/barber-apprenticeship/payment-setup/confirm`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Card setup failed. Please try again.');
      setSubmitting(false);
      return;
    }

    // Setup succeeded — activate subscription then go to complete
    try {
      const res = await fetch('/api/barber/activate-subscription', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to activate subscription. Contact support.');
        setSubmitting(false);
        return;
      }
    } catch {
      // Non-fatal — subscription activation will be retried by cron
    }

    router.push('/programs/barber-apprenticeship/orientation');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'auto', email: 'auto' } },
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl transition-colors text-base"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Setting up payments…
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" /> Save Card &amp; Activate Program
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        Your card will not be charged today. First payment of{' '}
        <strong className="text-slate-300">${(weeklyAmount / 100).toFixed(2)}</strong> drafts next
        Friday at 10:00 AM ET.
      </p>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentSetupPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [weeklyAmount, setWeeklyAmount] = useState(7095); // recalculated server-side from DB (transfer hours applied)
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/barber/setup-intent', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setFatalError(data.error);
          return;
        }
        setClientSecret(data.clientSecret);
        if (data.weeklyPaymentCents) setWeeklyAmount(data.weeklyPaymentCents);
      })
      .catch(() => setFatalError('Could not connect to payment system. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs uppercase tracking-widest mb-0.5">
              Barber Apprenticeship
            </p>
            <h1 className="text-white font-bold text-lg">Payment Setup</h1>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Lock className="w-3.5 h-3.5" />
            Secured by Stripe
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-8">
        {/* Summary card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Weekly Payment Plan</p>
              <p className="text-slate-400 text-sm">
                Barber Apprenticeship — 2,000 OJL hrs @ 40 hrs/wk
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: 'Total Tuition', value: `$${TUITION_DOLLARS.toLocaleString()}` },
                { label: 'Paid Today (Minimum)', value: `$${(MIN_SETUP_FEE_CENTS / 100).toLocaleString()}` },
                { label: 'Weekly', value: `$${(weeklyAmount / 100).toFixed(2)}` },
              ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-lg">{value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <div className="space-y-2">
          {[
            'No charge today — first draft next Friday',
            'Cancel or update your card anytime',
            'Automatic reminder 3 days before each payment',
            'Failed payments get a 7-day grace period before suspension',
          ].map((text) => (
            <div key={text} className="flex items-center gap-2.5 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Stripe form */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        )}

        {fatalError && (
          <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{fatalError}</p>
          </div>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#f59e0b',
                  colorBackground: '#1e293b',
                  colorText: '#f1f5f9',
                  colorDanger: '#f87171',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <PaymentSetupForm weeklyAmount={weeklyAmount} />
          </Elements>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs pt-2">
          <Shield className="w-3.5 h-3.5" />
          256-bit SSL encryption · PCI DSS compliant · Powered by Stripe
        </div>
      </div>
    </div>
  );
}
