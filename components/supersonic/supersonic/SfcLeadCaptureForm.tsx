'use client';

/**
 * SfcLeadCaptureForm
 * Lightweight inline lead-capture form used on contact, book-appointment,
 * and state pages. POSTs to /api/supersonic-fast-cash/leads.
 *
 * Props:
 *   source      — which page the form is on (stored on the lead row)
 *   sourceDetail — e.g. 'tax-preparation-indiana'
 *   serviceType  — pre-selected service (optional)
 *   heading      — overrides the default heading
 *   ctaLabel     — overrides the default button label
 *   onSuccess    — callback when lead is created (receives lead_id)
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type Source =
  | 'calculator' | 'service_page' | 'contact' | 'state_page'
  | 'book_appointment' | 'start' | 'upload' | 'referral' | 'website';

type ServiceType =
  | 'tax_prep' | 'refund_advance' | 'bookkeeping' | 'payroll'
  | 'diy' | 'audit_protection' | 'cash_advance';

interface Props {
  source: Source;
  sourceDetail?: string;
  serviceType?: ServiceType;
  heading?: string;
  ctaLabel?: string;
  onSuccess?: (leadId: string) => void;
}

export default function SfcLeadCaptureForm({
  source,
  sourceDetail,
  serviceType,
  heading = 'Get Started — We\'ll Contact You',
  ctaLabel = 'Request a Callback',
  onSuccess,
}: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/supersonic-fast-cash/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name:   firstName.trim(),
          last_name:    lastName.trim(),
          email:        email.trim(),
          phone:        phone.trim() || undefined,
          source,
          source_detail: sourceDetail,
          service_type:  serviceType,
        }),
      });

      const data: { success?: boolean; lead_id?: string; error?: string } = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
      onSuccess?.(data.lead_id ?? '');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-brand-blue-900 text-white p-8 text-center space-y-3">
        <div className="text-3xl">✓</div>
        <h3 className="text-xl font-black">We got it!</h3>
        <p className="text-white/80 text-sm leading-relaxed">
          Thanks, {firstName}. A member of our team will reach out to you at the contact
          information you provided — typically within one business day.
        </p>
        <p className="text-white/60 text-xs">
          Tax season hours: Mon – Fri 9am – 7pm ET · Sat 10am – 4pm ET
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
      <h3 className="text-xl font-black text-slate-900 mb-6">{heading}</h3>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sfc-first-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              First Name <span className="text-brand-red-600">*</span>
            </label>
            <input
              id="sfc-first-name"
              type="text"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
              placeholder="Jane"
            />
          </div>
          <div>
            <label htmlFor="sfc-last-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Last Name <span className="text-brand-red-600">*</span>
            </label>
            <input
              id="sfc-last-name"
              type="text"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
              placeholder="Smith"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sfc-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email Address <span className="text-brand-red-600">*</span>
          </label>
          <input
            id="sfc-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
            placeholder="jane@example.com"
          />
        </div>

        <div>
          <label htmlFor="sfc-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Phone Number <span className="text-slate-400 font-normal text-xs">(optional)</span>
          </label>
          <input
            id="sfc-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red-600"
            placeholder="(317) 555-0100"
          />
        </div>

        {error && (
          <p className="text-brand-red-600 text-sm font-medium" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {loading ? 'Sending…' : ctaLabel}
        </button>

        <p className="text-xs text-slate-500 text-center leading-relaxed">
          By submitting this form you agree to our{' '}
          <a href="/supersonic-fast-cash/legal/privacy" className="underline hover:text-brand-red-600">Privacy Policy</a>.
          We never sell your information.
        </p>
      </form>
    </div>
  );
}
