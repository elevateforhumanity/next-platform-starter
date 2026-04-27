'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/programs/esthetician/confirm` },
    });
    if (stripeError) { setError(stripeError.message ?? 'Payment failed'); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Complete Payment'}
      </button>
    </form>
  );
}

export default function EstheticianPaymentSetupPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ program: 'esthetician', amount: 210000 }),
    })
      .then(r => r.json())
      .then(d => setClientSecret(d.clientSecret));
  }, []);

  if (!clientSecret) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Complete Your Payment</h1>
          <p className="text-slate-600 text-sm">Esthetician Program — $2,100 deposit to secure your spot.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm />
          </Elements>
        </div>
      </div>
    </div>
  );
}
