'use client';

/**
 * PaymentPlanCalculator
 *
 * Fetches pricing from /api/programs/pricing?slug=<slug> (DB-driven).
 * Learner adjusts deposit with a slider — weekly payment updates live.
 * Shows Stripe deposit/full-pay CTAs from DB, not hardcoded.
 *
 * Formula:
 *   weekly = ceil((tuition - deposit) / payment_weeks)
 */

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';

interface ProgramPricing {
  program_slug: string;
  program_name: string;
  tuition_cents: number;
  deposit_min_cents: number;
  deposit_default_cents: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  payment_weeks: number;
  stripe_deposit_url: string | null;
  stripe_full_url: string | null;
  notes: string | null;
}

interface Props {
  programSlug: string;
  /** Override Stripe URLs if already known (avoids extra fetch) */
  stripeDepositUrl?: string;
  stripeFullUrl?: string;
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function PaymentPlanCalculator({ programSlug, stripeDepositUrl, stripeFullUrl }: Props) {
  const [pricing, setPricing] = useState<ProgramPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [depositCents, setDepositCents] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/programs/pricing?slug=${programSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setPricing(data);
        setDepositCents(data.deposit_default_cents);
      })
      .catch(() => setError('Could not load pricing'))
      .finally(() => setLoading(false));
  }, [programSlug]);

  const weeklyPayment = useCallback(() => {
    if (!pricing) return 0;
    const remaining = Math.max(0, pricing.tuition_cents - depositCents);
    return Math.ceil(remaining / pricing.payment_weeks);
  }, [pricing, depositCents]);

  const totalWeeks = pricing?.payment_weeks ?? 0;
  const weekly = weeklyPayment();
  const depositUrl = stripeDepositUrl ?? pricing?.stripe_deposit_url ?? null;
  const fullUrl = stripeFullUrl ?? pricing?.stripe_full_url ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading payment options…
      </div>
    );
  }

  if (error || !pricing) {
    return (
      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error || 'Pricing unavailable — contact us for details.'}
      </div>
    );
  }

  const minDeposit = pricing.deposit_min_cents;
  const maxDeposit = pricing.tuition_cents; // pay in full = max slider
  const remaining = Math.max(0, pricing.tuition_cents - depositCents);
  const payingInFull = depositCents >= pricing.tuition_cents;

  // Build amortization schedule for display
  const schedule: { period: number; amount: number }[] = [];
  if (!payingInFull) {
    let balance = remaining;
    for (let i = 1; i <= totalWeeks; i++) {
      const payment = Math.min(weekly, balance);
      if (payment <= 0) break;
      schedule.push({ period: i, amount: payment });
      balance -= payment;
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          Payment Calculator
        </p>
        <p className="text-white font-bold text-base">{pricing.program_name}</p>
        <p className="text-slate-400 text-xs mt-0.5">Total tuition: {fmt(pricing.tuition_cents)}</p>
      </div>

      <div className="p-5 space-y-6">
        {/* Deposit slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-800">
              Your deposit today
            </label>
            <span className="text-lg font-extrabold text-slate-900">{fmt(depositCents)}</span>
          </div>

          <input
            type="range"
            min={minDeposit}
            max={maxDeposit}
            step={100}  /* $1 increments */
            value={depositCents}
            onChange={(e) => setDepositCents(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900"
          />

          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Min {fmt(minDeposit)}</span>
            <span>Pay in full {fmt(pricing.tuition_cents)}</span>
          </div>
        </div>

        {/* Result */}
        {payingInFull ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800 font-bold text-lg">Pay in Full — {fmt(pricing.tuition_cents)}</p>
            <p className="text-green-700 text-sm mt-1">No weekly payments. Enroll immediately.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Deposit</p>
              <p className="text-xl font-extrabold text-slate-900">{fmt(depositCents)}</p>
              <p className="text-xs text-slate-400">due today</p>
            </div>
            <div className="bg-brand-red-50 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                {pricing.payment_frequency === 'weekly' ? 'Weekly' : pricing.payment_frequency === 'biweekly' ? 'Biweekly' : 'Monthly'}
              </p>
              <p className="text-xl font-extrabold text-slate-900">{fmt(weekly)}</p>
              <p className="text-xs text-slate-400">per payment</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Duration</p>
              <p className="text-xl font-extrabold text-slate-900">{schedule.length}</p>
              <p className="text-xs text-slate-400">payments</p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center -mt-2">
          Remaining balance: {fmt(remaining)} over {schedule.length} {pricing.payment_frequency} payments
        </p>

        {/* Payment schedule toggle */}
        {!payingInFull && schedule.length > 0 && (
          <div>
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              {showSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showSchedule ? 'Hide' : 'Show'} full payment schedule
            </button>

            {showSchedule && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-slate-500 font-semibold">Payment</th>
                      <th className="text-right px-3 py-2 text-slate-500 font-semibold">Amount</th>
                      <th className="text-right px-3 py-2 text-slate-500 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Deposit row */}
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-700">Deposit (today)</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{fmt(depositCents)}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{fmt(remaining)}</td>
                    </tr>
                    {/* Weekly rows */}
                    {schedule.map((row, i) => {
                      const balanceAfter = remaining - schedule.slice(0, i + 1).reduce((s, r) => s + r.amount, 0);
                      return (
                        <tr key={row.period} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-slate-600">
                            {pricing.payment_frequency === 'weekly' ? 'Week' : pricing.payment_frequency === 'biweekly' ? 'Biweek' : 'Month'} {row.period}
                          </td>
                          <td className="px-3 py-1.5 text-right text-slate-900">{fmt(row.amount)}</td>
                          <td className="px-3 py-1.5 text-right text-slate-400">{fmt(Math.max(0, balanceAfter))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {!payingInFull && depositUrl && (
            <a
              href={`${depositUrl}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Pay {fmt(depositCents)} Deposit — Start Today
            </a>
          )}
          {fullUrl && (
            <a
              href={fullUrl}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-red-600 text-white text-sm font-bold hover:bg-brand-red-700 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Pay {fmt(pricing.tuition_cents)} in Full
            </a>
          )}
          <p className="text-xs text-slate-400 text-center">
            {BNPL_PROVIDER_NAMES} accepted at checkout
          </p>
        </div>
      </div>
    </div>
  );
}
