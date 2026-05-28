'use client';

import { useState } from 'react';
import { ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const COMPONENT_TYPES = [
  { value: 'job_search', label: 'Job Search' },
  { value: 'job_search_training', label: 'Job Search Training' },
  { value: 'vocational_training', label: 'Vocational Training' },
  { value: 'work_experience', label: 'Work Experience' },
  { value: 'community_service', label: 'Community Service' },
  { value: 'education', label: 'Education (ABE/GED)' },
  { value: 'self_employment', label: 'Self-Employment Training' },
  { value: 'job_retention', label: 'Job Retention Services' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'exempted', label: 'Exempted' },
  { value: 'sanctioned', label: 'Sanctioned' },
];

type ComponentForm = {
  participant_id: string;
  component_type: string;
  start_date: string;
  end_date: string;
  required_hours: string;
  completed_hours: string;
  status: string;
  provider_name: string;
  notes: string;
};

const EMPTY: ComponentForm = {
  participant_id: '',
  component_type: 'vocational_training',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  required_hours: '',
  completed_hours: '0',
  status: 'active',
  provider_name: PLATFORM_DEFAULTS.orgName,
  notes: '',
};

interface Props {
  participantId?: string;
  participantName?: string;
  onSuccess?: () => void;
}

export default function ProgramComponentForm({ participantId, participantName, onSuccess }: Props) {
  const [form, setForm] = useState<ComponentForm>({
    ...EMPTY,
    participant_id: participantId ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: keyof ComponentForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const requiredHours = parseInt(form.required_hours || '0', 10);
  const completedHours = parseInt(form.completed_hours || '0', 10);
  const pctComplete = requiredHours > 0 ? Math.min(100, Math.round((completedHours / requiredHours) * 100)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.participant_id) {
      setError('Participant ID is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/fssa/plan-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: form.participant_id,
          component_type: form.component_type,
          start_date: form.start_date,
          end_date: form.end_date || null,
          required_hours: form.required_hours ? parseInt(form.required_hours, 10) : null,
          completed_hours: parseInt(form.completed_hours || '0', 10),
          status: form.status,
          provider_name: form.provider_name || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save component.');
        return;
      }
      setSuccess(true);
      setForm({ ...EMPTY, participant_id: participantId ?? '' });
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
          <p className="text-sm text-emerald-700">Program component saved.</p>
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
            Participant: <strong>{participantName}</strong>
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
            value={form.participant_id}
            onChange={(e) => set('participant_id', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Component Type</label>
          <select
            value={form.component_type}
            onChange={(e) => set('component_type', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COMPONENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Start Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set('start_date', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => set('end_date', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Required Hours</label>
          <input
            type="number"
            value={form.required_hours}
            onChange={(e) => set('required_hours', e.target.value)}
            min="0"
            placeholder="e.g. 160"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Completed Hours</label>
          <input
            type="number"
            value={form.completed_hours}
            onChange={(e) => set('completed_hours', e.target.value)}
            min="0"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Progress bar */}
      {requiredHours > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{completedHours} / {requiredHours} hrs ({pctComplete}%)</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pctComplete >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${pctComplete}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Provider / Location</label>
        <input
          type="text"
          value={form.provider_name}
          onChange={(e) => set('provider_name', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Exemption reason, sanction details, special circumstances..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Saving...' : 'Save Program Component'}
      </button>
    </form>
  );
}
