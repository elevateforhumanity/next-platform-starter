'use client';

import { useState } from 'react';
import { User, Phone, Mail, MapPin, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const INDIANA_COUNTIES = [
  'Adams', 'Allen', 'Bartholomew', 'Benton', 'Blackford', 'Boone', 'Brown', 'Carroll',
  'Cass', 'Clark', 'Clay', 'Clinton', 'Crawford', 'Daviess', 'Dearborn', 'Decatur',
  'DeKalb', 'Delaware', 'Dubois', 'Elkhart', 'Fayette', 'Floyd', 'Fountain', 'Franklin',
  'Fulton', 'Gibson', 'Grant', 'Greene', 'Hamilton', 'Hancock', 'Harrison', 'Hendricks',
  'Henry', 'Howard', 'Huntington', 'Jackson', 'Jasper', 'Jay', 'Jefferson', 'Jennings',
  'Johnson', 'Knox', 'Kosciusko', 'LaGrange', 'Lake', 'LaPorte', 'Lawrence', 'Madison',
  'Marion', 'Marshall', 'Martin', 'Miami', 'Monroe', 'Montgomery', 'Morgan', 'Newton',
  'Noble', 'Ohio', 'Orange', 'Owen', 'Parke', 'Perry', 'Pike', 'Porter', 'Posey',
  'Pulaski', 'Putnam', 'Randolph', 'Ripley', 'Rush', 'St. Joseph', 'Scott', 'Shelby',
  'Spencer', 'Starke', 'Steuben', 'Sullivan', 'Switzerland', 'Tippecanoe', 'Tipton',
  'Union', 'Vanderburgh', 'Vermillion', 'Vigo', 'Wabash', 'Warren', 'Warrick',
  'Washington', 'Wayne', 'Wells', 'White', 'Whitley',
];

const BARRIER_OPTIONS = [
  { value: 'basic_skills_deficient', label: 'Basic skills deficient' },
  { value: 'english_learner', label: 'English language learner' },
  { value: 'offender', label: 'Ex-offender / justice-involved' },
  { value: 'homeless', label: 'Homeless or at risk of homelessness' },
  { value: 'foster_care', label: 'Foster care youth (aged out)' },
  { value: 'disability', label: 'Individual with disability' },
  { value: 'single_parent', label: 'Single parent / pregnant' },
  { value: 'long_term_unemployed', label: 'Long-term unemployed (27+ weeks)' },
  { value: 'low_income', label: 'Low income' },
  { value: 'veteran', label: 'Veteran or eligible spouse' },
];

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  ssn_last4: string;
  case_number: string;
  county: string;
  snap_eligible: boolean;
  abawd: boolean;
  orientation_completed: boolean;
  barriers: string[];
  case_notes: string;
};

const INITIAL: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  ssn_last4: '',
  case_number: '',
  county: 'Marion',
  snap_eligible: true,
  abawd: false,
  orientation_completed: false,
  barriers: [],
  case_notes: '',
};

export default function ParticipantIntakeForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormState, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleBarrier = (value: string) => {
    setForm((prev) => ({
      ...prev,
      barriers: prev.barriers.includes(value)
        ? prev.barriers.filter((b) => b !== value)
        : [...prev.barriers, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/fssa/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          intake_completed_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save participant.');
        return;
      }
      setSuccess(true);
      setForm(INITIAL);
      onSuccess?.(data.id);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
        <h3 className="font-semibold text-emerald-800 text-lg mb-1">Participant Added</h3>
        <p className="text-sm text-emerald-700 mb-4">Intake record saved successfully.</p>
        <button
          onClick={() => setSuccess(false)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          Add Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Identity */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4" /> Participant Identity
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">SSN Last 4</label>
            <input
              type="text"
              value={form.ssn_last4}
              onChange={(e) => set('ssn_last4', e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              placeholder="####"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Contact */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Phone className="w-4 h-4" /> Contact
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      {/* FSSA / SNAP */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FileText className="w-4 h-4" /> FSSA / SNAP E&T
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">FSSA Case Number</label>
            <input
              type="text"
              value={form.case_number}
              onChange={(e) => set('case_number', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">County</label>
            <select
              value={form.county}
              onChange={(e) => set('county', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INDIANA_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.snap_eligible}
              onChange={(e) => set('snap_eligible', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            SNAP Eligible (verified)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.abawd}
              onChange={(e) => set('abawd', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            ABAWD (able-bodied adult without dependents)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.orientation_completed}
              onChange={(e) => set('orientation_completed', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Orientation completed
          </label>
        </div>
      </fieldset>

      {/* Barriers */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700">
          Barriers to Employment (select all that apply)
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BARRIER_OPTIONS.map((b) => (
            <label key={b.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.barriers.includes(b.value)}
                onChange={() => toggleBarrier(b.value)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {b.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Case Notes</label>
        <textarea
          value={form.case_notes}
          onChange={(e) => set('case_notes', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Initial assessment, referral source, special circumstances..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Saving...' : 'Save Participant Intake'}
      </button>
    </form>
  );
}
