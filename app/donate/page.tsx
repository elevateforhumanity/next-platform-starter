'use client';

import { useState } from 'react';
import { Heart, Users, GraduationCap, Briefcase, CheckCircle } from 'lucide-react';

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

const IMPACT = [
  { icon: GraduationCap, amount: '$250', label: 'Covers exam fees for one student' },
  { icon: Users,         amount: '$500', label: 'Funds one month of career coaching' },
  { icon: Briefcase,     amount: '$1,000', label: 'Sponsors a full scholarship for one student' },
  { icon: Heart,         amount: 'Any amount', label: 'Supports tools, materials, and student support services' },
];

export default function DonatePage() {
  const [selected, setSelected] = useState<number | null>(250);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = custom ? parseFloat(custom) : selected;

  async function handleDonate() {
    if (!amount || amount < 1) {
      setError('Please enter a valid donation amount.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/donate/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Support Our Mission</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Donate to Elevate for Humanity</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Elevate for Humanity is a nonprofit workforce development organization. Your donation directly funds scholarships, equipment, and career support for adults pursuing high-demand credentials.
          </p>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Your impact</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {IMPACT.map((item) => (
              <div key={item.amount} className="border border-slate-200 rounded-xl p-6 flex items-start gap-4">
                <item.icon className="w-8 h-8 text-brand-red-600 shrink-0" />
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{item.amount}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Make a donation</h2>
          <p className="text-slate-500 text-sm mb-8">
            Elevate for Humanity is a 501(c)(3) nonprofit. All donations are tax-deductible to the extent permitted by law.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => { setSelected(amt); setCustom(''); }}
                className={`py-3 rounded-xl font-bold text-sm border-2 transition-colors ${
                  selected === amt && !custom
                    ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-700'
                    : 'border-slate-200 text-slate-700 hover:border-brand-red-300'
                }`}
              >
                ${amt.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Or enter a custom amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
              <input
                type="number"
                min="1"
                placeholder="Other amount"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
                className="w-full pl-8 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-brand-red-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {amount && amount >= 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-red-600 shrink-0" />
              <p className="text-sm text-slate-700">
                You&apos;re donating <span className="font-extrabold text-slate-900">${amount.toLocaleString()}</span> to Elevate for Humanity.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
          )}

          <button
            onClick={handleDonate}
            disabled={loading || !amount || amount < 1}
            className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-xl transition-colors text-base"
          >
            {loading ? 'Redirecting to checkout…' : `Donate${amount && amount >= 1 ? ` $${amount.toLocaleString()}` : ''}`}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Secure checkout via Stripe · Elevate for Humanity · EIN available upon request
          </p>
        </div>
      </section>
    </div>
  );
}
