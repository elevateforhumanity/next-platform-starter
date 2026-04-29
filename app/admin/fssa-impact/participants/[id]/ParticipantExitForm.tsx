'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle } from 'lucide-react';

const EXIT_REASONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'training_complete', label: 'Training complete (not yet employed)' },
  { value: 'voluntary_exit', label: 'Voluntary exit' },
  { value: 'non_compliance', label: 'Non-compliance / sanction' },
  { value: 'ineligible', label: 'No longer eligible' },
  { value: 'other', label: 'Other' },
];

export default function ParticipantExitForm({ participantId }: { participantId: string }) {
  const router = useRouter();
  const [exitReason, setExitReason] = useState('');
  const [employed, setEmployed] = useState(false);
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [employmentStartDate, setEmploymentStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitReason) { setError('Exit reason is required.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/fssa/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: participantId,
          enrollment_status: 'exited',
          snap_et_exited_at: new Date().toISOString(),
          exit_reason: exitReason,
          employed_at_exit: employed,
          employer_name: employed ? employerName || null : null,
          job_title: employed ? jobTitle || null : null,
          hourly_wage: employed && hourlyWage ? parseFloat(hourlyWage) : null,
          hours_per_week: employed && hoursPerWeek ? parseInt(hoursPerWeek) : null,
          employment_start_date: employed ? employmentStartDate || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to record exit.'); return; }
      setSuccess(true);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 text-emerald-700 text-sm">
        <CheckCircle className="w-4 h-4" />
        Exit recorded.
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}

      <div>
        <label className={labelCls}>Exit Reason <span className="text-rose-500">*</span></label>
        <select className={inputCls} value={exitReason} onChange={e => setExitReason(e.target.value)} required>
          <option value="">Select reason...</option>
          {EXIT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={employed}
          onChange={e => setEmployed(e.target.checked)}
          className="rounded border-slate-300 text-blue-600"
        />
        Employed at exit
      </label>

      {employed && (
        <div className="space-y-3 pl-2 border-l-2 border-emerald-200">
          <div>
            <label className={labelCls}>Employer Name</label>
            <input className={inputCls} value={employerName} onChange={e => setEmployerName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Job Title</label>
            <input className={inputCls} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Hourly Wage ($)</label>
              <input type="number" className={inputCls} value={hourlyWage} onChange={e => setHourlyWage(e.target.value)} min="0" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Hours/Week</label>
              <input type="number" className={inputCls} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} min="0" max="80" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Employment Start Date</label>
            <input type="date" className={inputCls} value={employmentStartDate} onChange={e => setEmploymentStartDate(e.target.value)} />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Saving...' : 'Record Exit'}
      </button>
    </form>
  );
}
