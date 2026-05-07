'use client';

import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react';

const FUNDING_PHASES = [
  { value: 'PRE_WIOA', label: 'Pre-WIOA' },
  { value: 'WIOA', label: 'WIOA Funded' },
  { value: 'POST_CERT', label: 'Post-Certification' },
];

const CATEGORIES = [
  'Haircut Techniques',
  'Razor & Shaving Services',
  'Sanitation & Safety',
  'Client Consultation',
  'Shop Operations',
  'Other',
];

export default function OjtHoursLogger() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [fundingPhase, setFundingPhase] = useState('WIOA');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) {
      setError('Enter a valid number of hours');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch('/api/time/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_date: date,
        hours_claimed: parseFloat(hours),
        category,
        funding_phase: fundingPhase,
        notes,
        source_type: 'learner_self_report',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? 'Failed to log hours');
    } else {
      setSuccess(true);
      setHours('');
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <Clock className="w-4 h-4" />
        Log OJT Hours
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hours</label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 4"
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Funding Phase</label>
              <select
                value={fundingPhase}
                onChange={(e) => setFundingPhase(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FUNDING_PHASES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Skills practiced, supervisor name…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Hours logged — pending supervisor approval
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            {saving ? 'Submitting…' : 'Submit Hours'}
          </button>
        </form>
      )}
    </div>
  );
}
