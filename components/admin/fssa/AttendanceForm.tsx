'use client';

import { useState } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

const SESSION_TYPES = [
  { value: 'orientation', label: 'Orientation' },
  { value: 'training', label: 'Vocational Training' },
  { value: 'lab', label: 'Lab / Hands-On' },
  { value: 'job_search', label: 'Job Search Activity' },
  { value: 'support', label: 'Support Services' },
  { value: 'other', label: 'Other' },
];

// SNAP E&T ABAWD minimum: 20 hours/week structured activity
const ABAWD_WEEKLY_MIN = 20;

type AttendanceEntry = {
  participant_id: string;
  session_date: string;
  session_type: string;
  hours_attended: string;
  present: boolean;
  excused: boolean;
  notes: string;
};

const EMPTY_ENTRY: AttendanceEntry = {
  participant_id: '',
  session_date: new Date().toISOString().split('T')[0],
  session_type: 'training',
  hours_attended: '6',
  present: true,
  excused: false,
  notes: '',
};

interface Props {
  participantId?: string;
  participantName?: string;
  onSuccess?: () => void;
}

export default function AttendanceForm({ participantId, participantName, onSuccess }: Props) {
  const [entry, setEntry] = useState<AttendanceEntry>({
    ...EMPTY_ENTRY,
    participant_id: participantId ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: keyof AttendanceEntry, value: unknown) =>
    setEntry((prev) => ({ ...prev, [field]: value }));

  const hours = parseFloat(entry.hours_attended || '0');
  const hoursWarning = entry.present && hours < 4
    ? 'Less than 4 hours — verify this is correct for FSSA reporting.'
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.participant_id) {
      setError('Participant ID is required.');
      return;
    }
    if (isNaN(hours) || hours < 0 || hours > 24) {
      setError('Hours must be between 0 and 24.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/fssa/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: entry.participant_id,
          session_date: entry.session_date,
          session_type: entry.session_type,
          hours_attended: hours,
          present: entry.present,
          excused: entry.excused,
          notes: entry.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to record attendance.');
        return;
      }
      setSuccess(true);
      setEntry({ ...EMPTY_ENTRY, participant_id: participantId ?? '' });
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
          <p className="text-sm text-emerald-700">Attendance recorded.</p>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {participantName && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">
            Recording attendance for: <strong>{participantName}</strong>
          </p>
        </div>
      )}

      {!participantId && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Participant ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={entry.participant_id}
            onChange={(e) => set('participant_id', e.target.value)}
            placeholder="UUID from participant record"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Session Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={entry.session_date}
            onChange={(e) => set('session_date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Session Type</label>
          <select
            value={entry.session_type}
            onChange={(e) => set('session_type', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Hours Attended <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={entry.hours_attended}
            onChange={(e) => set('hours_attended', e.target.value)}
            min="0"
            max="24"
            step="0.5"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {hoursWarning && (
            <p className="text-xs text-amber-600 mt-1">{hoursWarning}</p>
          )}
        </div>
        <div className="flex flex-col gap-3 pt-5">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={entry.present}
              onChange={(e) => set('present', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Present
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={entry.excused}
              onChange={(e) => set('excused', e.target.checked)}
              disabled={entry.present}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
            />
            Excused absence
          </label>
        </div>
      </div>

      {/* ABAWD hours reminder */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            <strong>SNAP E&T requirement:</strong> ABAWD participants must complete at least{' '}
            <strong>{ABAWD_WEEKLY_MIN} hours/week</strong> of structured activity to maintain
            eligibility. Verify weekly totals in the attendance report.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
        <textarea
          value={entry.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tardiness, early departure, topic covered..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Saving...' : 'Record Attendance'}
      </button>
    </form>
  );
}
