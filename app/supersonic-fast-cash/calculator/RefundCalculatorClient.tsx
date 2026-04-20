'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';

interface FormState {
  filingStatus: FilingStatus;
  w2Wages: string;
  federalWithholding: string;
  dependents: string;
  has1099: boolean;
  income1099: string;
}

const filingStatusLabels: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married_joint', label: 'Married Filing Jointly' },
  { value: 'married_separate', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

function parseDollars(raw: string): number {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

export default function RefundCalculatorClient() {
  const [form, setForm] = useState<FormState>({
    filingStatus: 'single',
    w2Wages: '',
    federalWithholding: '',
    dependents: '0',
    has1099: false,
    income1099: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const dependentCount = Math.max(0, Math.min(10, parseInt(form.dependents, 10) || 0));
    const dependents = Array.from({ length: dependentCount }, (_, i) => ({ id: String(i + 1) }));

    const wages = parseDollars(form.w2Wages);
    const withholding = parseDollars(form.federalWithholding);

    const payload = {
      filingStatus: form.filingStatus,
      w2Income: [{ wages, federalWithholding: withholding }],
      hasChildTaxCredit: dependentCount > 0,
      dependents,
      deductionType: 'standard' as const,
      ...(form.has1099 && form.income1099
        ? { income1099: parseDollars(form.income1099) }
        : {}),
    };

    try {
      const res = await fetch('/api/supersonic-fast-cash/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Server error');
      }

      const data = await res.json();
      // The API returns refundAmount (positive = refund, negative = owed)
      const amount =
        typeof data.refundAmount === 'number'
          ? data.refundAmount
          : typeof data.estimatedRefund === 'number'
          ? data.estimatedRefund
          : null;

      if (amount === null) throw new Error('Unexpected response');
      setResult(amount);
    } catch {
      setError('Unable to calculate. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isRefund = result !== null && result >= 0;
  const displayAmount = result !== null ? Math.abs(result) : null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-2xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-6">
          {/* Filing Status */}
          <div>
            <label htmlFor="filingStatus" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Filing Status
            </label>
            <select
              id="filingStatus"
              value={form.filingStatus}
              onChange={(e) => set('filingStatus', e.target.value as FilingStatus)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
            >
              {filingStatusLabels.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* W-2 Wages */}
          <div>
            <label htmlFor="w2Wages" className="block text-sm font-semibold text-slate-700 mb-1.5">
              W-2 Wages
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                id="w2Wages"
                type="number"
                min="0"
                step="1"
                placeholder="55,000"
                value={form.w2Wages}
                onChange={(e) => set('w2Wages', e.target.value)}
                className="w-full pl-7 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
              />
            </div>
          </div>

          {/* Federal Withholding */}
          <div>
            <label htmlFor="withholding" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Federal Tax Withheld (from W-2 Box 2)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                id="withholding"
                type="number"
                min="0"
                step="1"
                placeholder="8,000"
                value={form.federalWithholding}
                onChange={(e) => set('federalWithholding', e.target.value)}
                className="w-full pl-7 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
              />
            </div>
          </div>

          {/* Dependents */}
          <div>
            <label htmlFor="dependents" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Number of Dependents (0–10)
            </label>
            <input
              id="dependents"
              type="number"
              min="0"
              max="10"
              step="1"
              value={form.dependents}
              onChange={(e) => set('dependents', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
            />
          </div>

          {/* 1099 Income */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has1099}
                onChange={(e) => set('has1099', e.target.checked)}
                className="w-4 h-4 accent-brand-red-600"
              />
              <span className="text-sm font-semibold text-slate-700">I have 1099 / self-employment income</span>
            </label>
            {form.has1099 && (
              <div className="mt-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1099 income amount"
                  value={form.income1099}
                  onChange={(e) => set('income1099', e.target.value)}
                  className="w-full pl-7 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Calculating…' : 'Calculate My Refund'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-center text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Result */}
        {result !== null && !error && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center space-y-4">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              {isRefund ? 'Estimated Refund' : 'Estimated Amount Owed'}
            </p>
            <p className={`text-5xl font-black ${isRefund ? 'text-green-600' : 'text-red-600'}`}>
              {isRefund ? '+' : '-'}${displayAmount!.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              This is an estimate only. Actual results may vary based on your full tax situation.
            </p>
            <Link
              href="/supersonic-fast-cash/start"
              className="inline-block mt-2 bg-brand-blue-900 hover:opacity-90 text-white font-bold px-8 py-3 rounded-lg transition-opacity"
            >
              File With Us to Get This Refund
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
