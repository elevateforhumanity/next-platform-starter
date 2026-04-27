'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, CreditCard, Heart, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Stripe payment links from lib/stripe/price-map.ts
const STRIPE = {
  deposit: 'https://buy.stripe.com/fZu00j2UUdnofsDcfDgIo0a', // $2,100 (35%)
  full: 'https://buy.stripe.com/9B600jbrq1EGdkvgvTgIo09', // $6,000
};

type FundingPath = 'self_pay' | 'fssa' | 'employer' | null;

export default function CosmetologyApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fundingPath, setFundingPath] = useState<FundingPath>(null);

  // Auth guard — enrollment requires a signed-in account
  useEffect(() => {
    const checkAuth = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login?redirect=/programs/cosmetology-apprenticeship/apply';
      }
    };
    checkAuth();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      city: (form.elements.namedItem('city') as HTMLInputElement).value,
      programInterest: 'cosmetology-apprenticeship',
      fundingPath: fundingPath ?? 'unknown',
      source: 'student-application',
    };

    try {
      const res = await fetch('/api/apply/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Submission failed. Please try again.');
      }

      router.push('/programs/cosmetology-apprenticeship/apply/success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/programs/cosmetology-apprenticeship"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Program
        </Link>

        <h1 className="text-2xl font-black text-slate-900 mb-1">Apply — Cosmetology Apprenticeship</h1>
        <p className="text-slate-500 text-sm mb-6">
          Select your funding path, then complete the form below.
        </p>

        {/* Funding path selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-sm font-bold text-slate-800 mb-3">How are you paying for this program?</p>
          <div className="space-y-2">
            {[
              {
                value: 'self_pay' as FundingPath,
                icon: <CreditCard className="w-4 h-4 text-slate-600" />,
                label: 'Self-pay — deposit or pay in full',
                sub: '$2,100 deposit today, or $6,000 in full. BNPL available.',
              },
              {
                value: 'fssa' as FundingPath,
                icon: <Heart className="w-4 h-4 text-purple-600" />,
                label: 'FSSA IMPACT (SNAP/TANF)',
                sub: 'I have or am getting a training authorization from my case worker.',
              },
              {
                value: 'employer' as FundingPath,
                icon: <Building2 className="w-4 h-4 text-blue-600" />,
                label: 'Employer / host salon sponsor',
                sub: 'My employer will sign an apprenticeship agreement.',
              },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  fundingPath === opt.value
                    ? 'border-slate-700 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="fundingPath"
                  value={opt.value ?? ''}
                  checked={fundingPath === opt.value}
                  onChange={() => setFundingPath(opt.value)}
                  className="mt-0.5 w-4 h-4 sr-only"
                />
                <div className="flex-shrink-0 mt-0.5">{opt.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Self-pay: Stripe buttons */}
          {fundingPath === 'self_pay' && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Pay now to secure your spot
              </p>
              <a
                href={STRIPE.deposit}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Pay $2,100 Deposit
              </a>
              <a
                href={STRIPE.full}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-red-600 text-white text-sm font-bold hover:bg-brand-red-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Pay $6,000 in Full
              </a>
              <p className="text-xs text-slate-400 text-center">
                Klarna · Afterpay · Zip · Cash App Pay accepted at checkout
              </p>
              <p className="text-xs text-slate-500 text-center pt-1">
                Or fill out the form below to apply first and pay later.
              </p>
            </div>
          )}

          {/* FSSA: guidance */}
          {fundingPath === 'fssa' && (
            <div className="mt-4 pt-4 border-t border-slate-100 bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-800">
                <strong>Next step:</strong> Contact your FSSA/DFR case worker and request an IMPACT
                training referral. Once you have your authorization letter, submit the form below
                and our team will coordinate enrollment.
              </p>
            </div>
          )}

          {/* Employer: guidance */}
          {fundingPath === 'employer' && (
            <div className="mt-4 pt-4 border-t border-slate-100 bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Next step:</strong> Submit the form below. Our team will contact your
                employer to set up the apprenticeship agreement before enrollment is confirmed.
              </p>
            </div>
          )}
        </div>

        {/* Application form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-bold text-slate-800 mb-1">Application Form</p>
          <p className="text-xs text-slate-500 mb-4">Free to submit — no payment required to apply.</p>

          <div className="bg-slate-50 rounded-lg p-4 mb-5 space-y-2">
            {[
              'Free to apply — no cost to submit',
              'Earn wages from day one of training',
              'Nationally recognized credential upon completion',
              'Flexible scheduling around your life',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="firstName">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lastName">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="email">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="phone">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="city">
                City *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                'Submit Application'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Questions?{' '}
              <a href="tel:3173143757" className="text-brand-blue-600 hover:underline">
                (317) 314-3757
              </a>{' '}
              or{' '}
              <a
                href="mailto:info@elevateforhumanity.org"
                className="text-brand-blue-600 hover:underline"
              >
                email us
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
