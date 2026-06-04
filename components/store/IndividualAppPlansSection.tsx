'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Clock, Loader2, ShoppingCart } from 'lucide-react';
import type { IndividualAppCatalog } from '@/lib/apps/individual-app-plans';

interface Props {
  catalog: IndividualAppCatalog;
}

export function IndividualAppPlansSection({ catalog }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (planId: string) => {
    setError(null);
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/apps/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appSlug: catalog.slug, plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(`/store/apps/${catalog.slug}`)}`;
          return;
        }
        throw new Error(data.error || 'Checkout failed');
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-800 px-4 py-2 rounded-full text-sm font-bold">
            <Clock className="w-4 h-4" />
            {catalog.trialDays}-day free trial — individual account
          </span>
        </div>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Individual plans</h2>
        <p className="text-slate-600 text-center mb-4 max-w-2xl mx-auto">{catalog.tagline}</p>
        <p className="text-center mb-10">
          <Link
            href={catalog.trialHref}
            className="text-brand-blue-600 font-semibold hover:underline"
          >
            Start free trial (no card)
          </Link>
          {catalog.importHref ? (
            <>
              {' '}
              ·{' '}
              <Link href={catalog.importHref} className="text-brand-blue-600 font-semibold hover:underline">
                Import an existing website
              </Link>
            </>
          ) : null}
        </p>

        {error && (
          <p className="mb-6 text-center text-sm text-brand-red-600 bg-brand-red-50 border border-brand-red-200 rounded-lg py-2 px-4 max-w-lg mx-auto">
            {error}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {catalog.plans.map((plan) => {
            const popular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 flex flex-col ${
                  popular
                    ? 'bg-brand-blue-600 text-white ring-4 ring-brand-blue-300 shadow-xl'
                    : 'bg-white border border-slate-200'
                }`}
              >
                {popular && (
                  <span className="self-start bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    MOST POPULAR
                  </span>
                )}
                <h3 className={`text-2xl font-bold ${popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">${plan.priceMonthly}</span>
                  <span className={popular ? 'text-brand-blue-100' : 'text-slate-600'}>/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`w-5 h-5 flex-shrink-0 ${popular ? 'text-white' : 'text-brand-green-600'}`}
                      />
                      <span className={popular ? 'text-white' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={loadingPlan !== null}
                    onClick={() => subscribe(plan.id)}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                      popular
                        ? 'bg-white text-brand-blue-700 hover:bg-brand-blue-50'
                        : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    Subscribe — {plan.priceLabel}
                  </button>
                  <Link
                    href={catalog.trialHref}
                    className={`block w-full text-center py-2.5 rounded-lg text-sm font-semibold border ${
                      popular
                        ? 'border-white/40 text-white hover:bg-white/10'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Try free for {catalog.trialDays} days
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500 mt-8 max-w-xl mx-auto">
          Individual subscriptions are tied to your login — not an organization license. Need a team or
          WIOA provider site?{' '}
          <Link href="/store/trial" className="text-brand-blue-600 hover:underline">
            Managed platform trial
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
