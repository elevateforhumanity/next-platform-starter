'use client';

import { useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'personnel', label: 'Personnel / Instruction' },
  { value: 'training', label: 'Training Materials & Supplies' },
  { value: 'support_services', label: 'Support Services (transportation, childcare, etc.)' },
  { value: 'admin', label: 'Administrative / Indirect' },
  { value: 'testing', label: 'Credential Testing Fees' },
  { value: 'other', label: 'Other' },
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// Current fiscal year default
const currentFY = () => {
  const now = new Date();
  // Indiana state FY runs July 1 – June 30
  return now.getMonth() >= 6 ? `FY${now.getFullYear() + 1}` : `FY${now.getFullYear()}`;
};

type BudgetLine = {
  fiscal_year: string;
  quarter: string;
  category: string;
  line_item: string;
  budgeted_amount: string;
  expended_amount: string;
  encumbered: string;
  notes: string;
};

const EMPTY: BudgetLine = {
  fiscal_year: currentFY(),
  quarter: '',
  category: 'personnel',
  line_item: '',
  budgeted_amount: '',
  expended_amount: '0',
  encumbered: '0',
  notes: '',
};

interface Props {
  onSuccess?: () => void;
}

export default function BudgetForm({ onSuccess }: Props) {
  const [form, setForm] = useState<BudgetLine>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: keyof BudgetLine, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const budgeted = parseFloat(form.budgeted_amount || '0');
  const expended = parseFloat(form.expended_amount || '0');
  const reimbursable = expended * 0.5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.line_item.trim()) {
      setError('Line item description is required.');
      return;
    }
    if (isNaN(budgeted) || budgeted < 0) {
      setError('Budgeted amount must be a positive number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/fssa/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscal_year: form.fiscal_year,
          quarter: form.quarter || null,
          category: form.category,
          line_item: form.line_item,
          budgeted_amount: budgeted,
          expended_amount: parseFloat(form.expended_amount || '0'),
          encumbered: parseFloat(form.encumbered || '0'),
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save budget line.');
        return;
      }
      setSuccess(true);
      setForm(EMPTY);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">Budget line saved.</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fiscal Year</label>
          <input
            type="text"
            value={form.fiscal_year}
            onChange={(e) => set('fiscal_year', e.target.value)}
            placeholder="FY2026"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Quarter (optional)</label>
          <select
            value={form.quarter}
            onChange={(e) => set('quarter', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All quarters</option>
            {QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Line Item Description <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={form.line_item}
          onChange={(e) => set('line_item', e.target.value)}
          placeholder="e.g. Instructor salary — HVAC cohort Q1"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Budgeted Amount ($) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={form.budgeted_amount}
            onChange={(e) => set('budgeted_amount', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Expended ($)</label>
          <input
            type="number"
            value={form.expended_amount}
            onChange={(e) => set('expended_amount', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Encumbered ($)</label>
          <input
            type="number"
            value={form.encumbered}
            onChange={(e) => set('encumbered', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Live reimbursement estimate */}
      {expended > 0 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700">
              Estimated SNAP E&T reimbursement on this line (50%):{' '}
              <strong>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reimbursable)}
              </strong>
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Invoice number, vendor, justification..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Saving...' : 'Save Budget Line'}
      </button>
    </form>
  );
}
