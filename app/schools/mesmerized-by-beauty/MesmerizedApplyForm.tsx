'use client';

import { useState } from 'react';

const PROGRAMS = [
  { value: 'cosmetology-apprenticeship',      label: 'Cosmetology Apprenticeship' },
  { value: 'esthetician-apprenticeship',      label: 'Esthetician Apprenticeship' },
  { value: 'nail-technician-apprenticeship',  label: 'Nail Technician Apprenticeship' },
];

const FUNDING_OPTIONS = [
  { value: 'wioa',            label: 'WIOA / Workforce Ready Grant' },
  { value: 'self-pay',        label: 'Self-Pay' },
  { value: 'employer',        label: 'Employer Sponsored' },
  { value: 'unsure',          label: 'Not Sure Yet' },
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function MesmerizedApplyForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    city: '', state: 'IN', zip: '',
    programInterest: '', fundingSource: '', priorExperience: '', notes: '',
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/schools/mesmerized-by-beauty/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-purple-50 border border-purple-200 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Application Received</h3>
        <p className="text-slate-600 text-sm max-w-sm mx-auto">
          We've sent a confirmation to <strong>{form.email}</strong>. The Mesmerized by Beauty team
          will be in touch within 1–2 business days.
        </p>
      </div>
    );
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name *</label>
          <input required className={inputCls} placeholder="First name" value={form.firstName} onChange={set('firstName')} />
        </div>
        <div>
          <label className={labelCls}>Last Name *</label>
          <input required className={inputCls} placeholder="Last name" value={form.lastName} onChange={set('lastName')} />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Email *</label>
          <input required type="email" className={inputCls} placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input required type="tel" className={inputCls} placeholder="(317) 555-0100" value={form.phone} onChange={set('phone')} />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>City</label>
          <input className={inputCls} placeholder="Indianapolis" value={form.city} onChange={set('city')} />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input className={inputCls} placeholder="IN" maxLength={2} value={form.state} onChange={set('state')} />
        </div>
        <div>
          <label className={labelCls}>ZIP</label>
          <input className={inputCls} placeholder="46268" maxLength={10} value={form.zip} onChange={set('zip')} />
        </div>
      </div>

      {/* Program */}
      <div>
        <label className={labelCls}>Program Interest *</label>
        <select required className={inputCls} value={form.programInterest} onChange={set('programInterest')}>
          <option value="">Select a program…</option>
          {PROGRAMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Funding */}
      <div>
        <label className={labelCls}>How do you plan to fund your training?</label>
        <select className={inputCls} value={form.fundingSource} onChange={set('fundingSource')}>
          <option value="">Select an option…</option>
          {FUNDING_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Prior experience */}
      <div>
        <label className={labelCls}>Prior cosmetology / beauty experience (optional)</label>
        <textarea rows={2} className={inputCls} placeholder="e.g. 6 months at a salon, completed 200 hours at another school…" value={form.priorExperience} onChange={set('priorExperience')} />
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Anything else you'd like us to know? (optional)</label>
        <textarea rows={2} className={inputCls} placeholder="Questions, scheduling needs, etc." value={form.notes} onChange={set('notes')} />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        By submitting you agree to be contacted by Mesmerized by Beauty and Elevate for Humanity
        regarding your application. No spam.
      </p>
    </form>
  );
}
