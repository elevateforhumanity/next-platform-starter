'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;

export default function QMAApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('');

  // Step 2 — qualify
  const [hasCna, setHasCna] = useState('');       // CNA cert is required
  const [snapTanf, setSnapTanf] = useState('');   // FSSA IMPACT eligibility
  const [timeline, setTimeline] = useState('');

  const field =
    'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none';
  const pill = (active: boolean) =>
    `flex-1 rounded-xl border px-4 py-3 text-sm font-semibold text-center cursor-pointer transition-colors ${
      active
        ? 'border-brand-blue-700 bg-brand-blue-50 text-brand-blue-700'
        : 'border-slate-300 text-slate-700 hover:border-slate-400'
    }`;

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          zip,
          program: 'qma',
          programSlug: 'qma',
          programName: 'Qualified Medication Aide (QMA)',
          contactPreference: 'phone',
          source: 'program-page',
          qualifyEmployed: hasCna === 'Yes' ? 'cna-certified' : 'no-cna',
          fundingType: snapTanf === 'Yes' ? 'fssa' : 'wioa',
          fundingInterest: snapTanf === 'Yes' ? 'fssa' : 'wioa',
          qualifyTimeline: timeline,
          // QMA-specific: CNA prerequisite flag
          transferHoursClaimed: hasCna === 'Yes',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.');
        return;
      }
      router.push(`/programs/qma/apply/success${data.id ? `?id=${data.id}` : ''}`);
    } catch {
      setError('Unexpected error. Please call (317) 314-3757.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-lg px-6 py-12">
        <Link
          href="/programs/qma"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8"
        >
          ← Back to QMA program
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= n ? 'bg-brand-blue-700 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {n}
              </div>
              {n < 3 && (
                <div className={`h-0.5 w-8 ${step > n ? 'bg-brand-blue-700' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-slate-400">
            {step === 1 ? 'Contact info' : step === 2 ? 'Quick questions' : 'Review & submit'}
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-1">Apply for QMA Training</h1>
            <p className="text-slate-500 text-sm mb-6">
              Qualified Medication Aide — Indiana ISDH credential
            </p>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">First name *</label>
                  <input
                    required
                    className={field}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Last name *</label>
                  <input
                    required
                    className={field}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone *</label>
                <input
                  required
                  type="tel"
                  className={field}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="317-555-0100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email *</label>
                <input
                  required
                  type="email"
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">ZIP code *</label>
                <input
                  required
                  className={field}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="46201"
                  maxLength={10}
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (!firstName || !lastName || !phone || !email || !zip) {
                  setError('Please fill in all fields.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="mt-6 w-full rounded-xl bg-brand-blue-700 px-6 py-3.5 font-semibold text-white hover:bg-brand-blue-800 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-1">A few quick questions</h1>
            <p className="text-slate-500 text-sm mb-6">
              Helps us confirm eligibility and find funding options.
            </p>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-1">
                  Do you hold an active Indiana CNA certification? *
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  Indiana law requires an active CNA credential to enroll in QMA training. If you
                  are not yet a CNA,{' '}
                  <Link href="/programs/cna" className="text-brand-blue-700 underline">
                    see our CNA program
                  </Link>
                  .
                </p>
                <div className="flex gap-3">
                  {['Yes', 'No'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setHasCna(v)}
                      className={pill(hasCna === v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {hasCna === 'No' && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    You must be a certified CNA to enroll in QMA training. We can still take your
                    application — our team will contact you about the CNA program first.
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">
                  Do you currently receive SNAP (food stamps) or TANF benefits?
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  FSSA IMPACT may cover 100% of tuition for eligible SNAP/TANF recipients. WIOA
                  funding is also available.
                </p>
                <div className="flex gap-3">
                  {['Yes', 'No', 'Not sure'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSnapTanf(v)}
                      className={pill(snapTanf === v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">When do you want to start?</p>
                <div className="flex flex-wrap gap-3">
                  {['ASAP', 'Within 30 days', 'Just exploring'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTimeline(v)}
                      className={pill(timeline === v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!hasCna || !snapTanf || !timeline) {
                    setError('Please answer all three questions.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                className="flex-[2] rounded-xl bg-brand-blue-700 px-6 py-3.5 font-semibold text-white hover:bg-brand-blue-800 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-1">You&apos;re almost done</h1>
            {snapTanf === 'Yes' ? (
              <p className="text-slate-700 text-sm mb-6">
                Based on your answers,{' '}
                <strong>you may qualify for FSSA IMPACT funding</strong> — potentially $0 tuition.
                Our team will verify your eligibility and contact you within 1 business day.
              </p>
            ) : (
              <p className="text-slate-700 text-sm mb-6">
                Our team will review your application and contact you about WIOA funding options and
                self-pay plans ($1,200). We&apos;ll help you find the best path.
              </p>
            )}

            {/* Summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-6 space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-medium">Name:</span> {firstName} {lastName}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {phone}
              </p>
              <p>
                <span className="font-medium">Email:</span> {email}
              </p>
              <p>
                <span className="font-medium">ZIP:</span> {zip}
              </p>
              <p>
                <span className="font-medium">Active CNA cert:</span> {hasCna}
              </p>
              <p>
                <span className="font-medium">Receives SNAP/TANF:</span> {snapTanf}
              </p>
              <p>
                <span className="font-medium">Funding path:</span>{' '}
                {snapTanf === 'Yes'
                  ? 'FSSA IMPACT (pending eligibility)'
                  : 'WIOA / self-pay ($1,200)'}
              </p>
              <p>
                <span className="font-medium">Timeline:</span> {timeline}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] rounded-xl bg-brand-blue-700 px-6 py-3.5 font-semibold text-white hover:bg-brand-blue-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              By submitting you agree to our{' '}
              <Link href="/legal/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
