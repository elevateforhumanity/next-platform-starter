'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, DollarSign, Calendar } from 'lucide-react';

interface PaymentPlan {
  label: string;
  months: number;
  monthly: number;
  total: number;
  downPayment: number;
}

interface Props {
  programSlug: string;
}

// Fallback plans used when the DB has no pricing row for this program.
// These are illustrative — actual amounts come from the API when available.
function buildFallbackPlans(tuition: number): PaymentPlan[] {
  return [
    {
      label: 'Pay in Full',
      months: 1,
      monthly: tuition,
      total: tuition,
      downPayment: 0,
    },
    {
      label: '3-Month Plan',
      months: 3,
      monthly: Math.ceil(tuition / 3),
      total: Math.ceil(tuition / 3) * 3,
      downPayment: Math.ceil(tuition / 3),
    },
    {
      label: '6-Month Plan',
      months: 6,
      monthly: Math.ceil(tuition / 6),
      total: Math.ceil(tuition / 6) * 6,
      downPayment: Math.ceil(tuition / 6),
    },
  ];
}

function fmt$(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function PaymentPlanCalculator({ programSlug }: Props) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/programs/${programSlug}/pricing`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.plans?.length) {
            setPlans(data.plans);
            return;
          }
        }
      } catch {
        // fall through to fallback
      }

      // Fallback: derive from a reasonable default tuition
      if (!cancelled) {
        setPlans(buildFallbackPlans(3500));
      }
    }

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [programSlug]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!plans.length) return null;

  const active = plans[selected];

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        Payment Options
      </p>

      {/* Plan selector */}
      <div className="space-y-2">
        {plans.map((plan, i) => (
          <button
            key={plan.label}
            type="button"
            onClick={() => setSelected(i)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition ${
              selected === i
                ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>{plan.label}</span>
            <span className="font-bold">
              {plan.months === 1 ? fmt$(plan.total) : `${fmt$(plan.monthly)}/mo`}
            </span>
          </button>
        ))}
      </div>

      {/* Selected plan detail */}
      {active.months > 1 && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span>Monthly payment</span>
            <span className="font-semibold text-slate-800">{fmt$(active.monthly)}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span className="font-semibold text-slate-800">{active.months} months</span>
          </div>
          {active.downPayment > 0 && (
            <div className="flex justify-between">
              <span>First payment (due at enrollment)</span>
              <span className="font-semibold text-slate-800">{fmt$(active.downPayment)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
            <span>Total</span>
            <span className="font-bold text-slate-900">{fmt$(active.total)}</span>
          </div>
        </div>
      )}

      {/* Enroll CTA */}
      <Link
        href={`/programs/${programSlug}/apply`}
        className="flex items-center justify-center gap-2 w-full py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl text-sm transition"
      >
        <CreditCard className="w-4 h-4" />
        Enroll — {active.months === 1 ? fmt$(active.total) : `${fmt$(active.monthly)}/mo`}
      </Link>

      <p className="text-xs text-center text-slate-400">
        WIOA / WRG funding may cover full tuition.{' '}
        <Link href="/funding" className="text-brand-blue-600 hover:underline">
          Check eligibility
        </Link>
      </p>
    </div>
  );
}
