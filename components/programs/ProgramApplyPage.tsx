'use client';

/**
 * ProgramApplyPage — shared apply page for all programs.
 *
 * Driven entirely by ProgramSchema data. Handles:
 *   - Auth guard (redirects to /login if no session)
 *   - Funding eligibility flow (WIOA / WRG / FSSA / IMPACT)
 *   - Self-pay: Stripe, Affirm, Sezzle, Afterpay/Klarna
 *   - Funded: application saved, redirect to success
 *   - All payment options driven by program.fundingOptions
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CreditCard, Info, CheckCircle } from 'lucide-react';
import FundingEligibilityFlow, {
  type EligibilityStatus,
} from '@/components/programs/FundingEligibilityFlow';
import type { ProgramSchema } from '@/lib/programs/program-schema';

interface Props {
  program: ProgramSchema;
}

function parseCost(raw: string): number {
  const m = raw.replace(/,/g, '').match(/\$?([\d]+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function ProgramApplyPage({ program }: Props) {
  const fullPrice = parseCost(program.selfPayCost ?? '0');
  const depositAmount = Math.round(fullPrice * 0.2);
  const remainingBalance = fullPrice - depositAmount;
  const minWeekly = program.durationWeeks
    ? Math.ceil((remainingBalance / program.durationWeeks) * 100) / 100
    : 50;

  const hasFunding = (program.fundingOptions ?? []).some((f) =>
    ['wioa', 'wrg', 'impact', 'fssa'].includes(f),
  );
  const hasSelfPay = (program.fundingOptions ?? []).includes('self_pay');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorSeverity, setErrorSeverity] = useState<'info' | 'critical'>('info');
  const [submitted, setSubmitted] = useState(false);

  const [paymentOption, setPaymentOption] = useState<
    'weekly' | 'full' | 'affirm' | 'sezzle' | 'stripe-bnpl'
  >('weekly');
  const [customWeekly, setCustomWeekly] = useState(minWeekly);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: '',
    fundingInterest: hasFunding ? 'wioa' : 'self-pay',
  });

  const [fundingEligibilityStatus, setFundingEligibilityStatus] =
    useState<EligibilityStatus | null>(null);

  // Auth guard
  useEffect(() => {
    const check = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/login?redirect=/programs/${program.slug}/apply`;
      }
    };
    check();
  }, [program.slug]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'fundingInterest') setFundingEligibilityStatus(null);
  };

  const isFunded = ['wioa', 'wrg', 'fssa', 'impact'].includes(formData.fundingInterest);
  const fundedReady =
    formData.fundingInterest === 'employer' ||
    formData.fundingInterest === 'unsure' ||
    (isFunded && fundingEligibilityStatus !== null);

  const canSubmit =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    (formData.fundingInterest === 'self-pay' || fundedReady);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  async function handleSubmit() {
    if (!canSubmit) {
      setError('Please fill in all required fields.');
      setErrorSeverity('info');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Save application
      const appRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          program: program.title,
          programSlug: program.slug,
          fundingType: formData.fundingInterest,
          fundingEligibilityStatus: fundingEligibilityStatus ?? undefined,
          source: 'program-page',
          paymentOption: formData.fundingInterest === 'self-pay' ? paymentOption : 'funded',
        }),
      });

      let appData: { id?: string; error?: string } = {};
      try { appData = await appRes.json(); } catch { /* ignore */ }

      if (!appRes.ok) {
        const msg =
          appRes.status === 503
            ? 'Our system is temporarily unavailable. Please call (317) 314-3757.'
            : appRes.status === 409
              ? appData.error || 'A duplicate application was found. Please call (317) 314-3757.'
              : appData.error || 'Failed to submit. Please try again or call (317) 314-3757.';
        setError(msg);
        setErrorSeverity('critical');
        setLoading(false);
        return;
      }

      const applicationId = appData?.id;
      const successUrl = `/programs/${program.slug}/apply/success${applicationId ? `?id=${applicationId}` : ''}`;

      // Funded path — no payment needed
      if (formData.fundingInterest !== 'self-pay') {
        window.location.href = successUrl;
        return;
      }

      // Self-pay — Affirm
      if (paymentOption === 'affirm') {
        const res = await fetch('/api/affirm/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: program.slug,
            programSlug: program.slug,
            programName: program.title,
            amount: depositAmount,
            paymentOption: 'deposit',
            applicationId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.checkoutConfig) {
          setError(data.error || 'Affirm is temporarily unavailable. Please select another option.');
          setErrorSeverity('info');
          setLoading(false);
          return;
        }
        try {
          (window as any)._affirm_config = { public_api_key: data.publicKey, script: data.affirmJsUrl };
          if (!(window as any).affirm) {
            await new Promise<void>((resolve, reject) => {
              const s = document.createElement('script');
              s.src = data.affirmJsUrl;
              s.async = true;
              s.onload = () => resolve();
              s.onerror = () => reject();
              document.head.appendChild(s);
            });
          }
          const sdk = (window as any).affirm;
          sdk?.checkout?.(data.checkoutConfig);
          sdk?.checkout?.open();
        } catch {
          setError('Affirm checkout could not load. Please select another option.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Self-pay — Sezzle
      if (paymentOption === 'sezzle') {
        const res = await fetch('/api/sezzle/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            programId: program.slug,
            programSlug: program.slug,
            programName: program.title,
            amount: Math.min(2500, depositAmount),
            paymentOption: 'deposit',
            description: `${program.title} — deposit via Sezzle`,
            applicationId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setError(data.error || 'Sezzle is temporarily unavailable. Please select another option.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Self-pay — Stripe BNPL (Afterpay/Klarna)
      if (paymentOption === 'stripe-bnpl') {
        const res = await fetch('/api/enroll/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmount,
            program: program.slug,
            paymentType: 'deposit',
            description: `${program.title} — deposit via Afterpay/Klarna`,
            successUrl: `${siteUrl}/programs/${program.slug}/apply/success?payment=bnpl`,
            cancelUrl: `${siteUrl}/programs/${program.slug}/apply`,
          }),
        });
        const data = await res.json();
        if (res.ok && (data.checkoutUrl || data.url)) {
          window.location.href = data.checkoutUrl || data.url;
        } else {
          setError(data.error || 'Afterpay/Klarna unavailable. Please select another option.');
          setErrorSeverity('info');
          setLoading(false);
        }
        return;
      }

      // Self-pay — Stripe (full or deposit/weekly)
      const isFullPay = paymentOption === 'full';
      const chargeAmount = isFullPay ? fullPrice : depositAmount;
      const res = await fetch('/api/enroll/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: chargeAmount,
          program: program.slug,
          paymentType: isFullPay ? 'full' : 'deposit',
          description: `${program.title} — ${isFullPay ? 'full payment' : 'deposit'} ($${chargeAmount})`,
          successUrl: `${siteUrl}/programs/${program.slug}/apply/success?payment=stripe`,
          cancelUrl: `${siteUrl}/programs/${program.slug}/apply`,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.checkoutUrl || data.url)) {
        window.location.href = data.checkoutUrl || data.url;
      } else {
        setError(data.error || 'Unable to create checkout. Please try again.');
        setErrorSeverity('critical');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again or call (317) 314-3757.');
      setErrorSeverity('critical');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted</h1>
          <p className="text-slate-600 mb-6">
            We&apos;ll be in touch within 1 business day to confirm your enrollment.
          </p>
          <Link href={`/programs/${program.slug}`} className="text-brand-blue-600 font-medium hover:underline">
            ← Back to {program.title}
          </Link>
        </div>
      </main>
    );
  }

  const fundingLabel: Record<string, string> = {
    wioa: 'WIOA (Workforce Innovation & Opportunity Act)',
    wrg: 'Workforce Ready Grant',
    impact: 'FSSA IMPACT / Next Level Jobs',
    fssa: 'FSSA IMPACT',
    employer_paid: 'Employer Sponsored',
    self_pay: 'Self-Pay',
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href={`/programs/${program.slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {program.title}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Apply — {program.title}</h1>
          <p className="text-white/80 text-lg">
            {program.durationWeeks} weeks · {program.schedule ?? 'Flexible schedule'}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-brand-blue-700 rounded-2xl p-6 text-white sticky top-8">
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-white/70 text-xs uppercase mb-1">Duration</div>
                    <div className="text-2xl font-black">{program.durationWeeks ?? '—'} Wks</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-xs uppercase mb-1">Credentials</div>
                    <div className="text-2xl font-black">{program.credentials?.length ?? '—'}</div>
                  </div>
                </div>
              </div>

              {program.credentials && program.credentials.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-sm mb-2">Credentials Earned</h3>
                  <ul className="text-xs text-white/90 space-y-1">
                    {program.credentials.slice(0, 5).map((c, i) => (
                      <li key={i}>• {c.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.fundingInterest === 'self-pay' && hasSelfPay && fullPrice > 0 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-bold text-sm">Program Cost</span>
                  </div>
                  <div className="text-center mb-3">
                    <div className="text-3xl font-black">${fullPrice.toLocaleString()}</div>
                    <div className="text-white/70 text-xs">total tuition</div>
                  </div>
                  <div className="text-xs text-white/80 space-y-1">
                    <p>• 20% deposit: ${depositAmount.toLocaleString()}</p>
                    <p>• Weekly plans available</p>
                    <p>• Affirm · Sezzle · Afterpay · Klarna</p>
                  </div>
                </div>
              )}

              {formData.fundingInterest !== 'self-pay' && (
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-black">May be $0</div>
                    <p className="text-xs text-white/80 mt-1">
                      with workforce funding for eligible Indiana residents
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-white/70 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/80">
                  Questions? Call (317) 314-3757 or{' '}
                  <Link href="/contact" className="underline">contact us</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {error && (
              <div className={`mb-6 p-4 rounded-lg border ${
                errorSeverity === 'critical'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Your Information</h2>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                  placeholder="(317) 555-0100"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Relevant Experience (optional)
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none resize-none"
                  placeholder={`Any background in ${program.sector ?? 'this field'}?`}
                />
              </div>

              {/* Funding */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  How will you fund your training? *
                </label>
                <div className="space-y-2">
                  {(program.fundingOptions ?? []).map((opt) => {
                    const key = opt === 'self_pay' ? 'self-pay' : opt;
                    const label = fundingLabel[opt] ?? opt;
                    return (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="funding"
                          value={key}
                          checked={formData.fundingInterest === key}
                          onChange={() => updateField('fundingInterest', key)}
                          className="text-brand-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </label>
                    );
                  })}
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="funding"
                      value="unsure"
                      checked={formData.fundingInterest === 'unsure'}
                      onChange={() => updateField('fundingInterest', 'unsure')}
                      className="text-brand-blue-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Not sure — help me find funding</span>
                  </label>
                </div>
              </div>

              {/* Funding eligibility flow for WIOA/WRG/FSSA */}
              {['wioa', 'wrg', 'fssa', 'impact'].includes(formData.fundingInterest) && (
                <div className="border border-brand-blue-200 rounded-xl p-4 bg-brand-blue-50">
                  <FundingEligibilityFlow
                    fundingType={
                      formData.fundingInterest === 'impact'
                        ? 'fssa'
                        : (formData.fundingInterest as 'wioa' | 'wrg' | 'fssa')
                    }
                    onReady={(status) => setFundingEligibilityStatus(status)}
                  />
                </div>
              )}

              {/* Self-pay payment options */}
              {formData.fundingInterest === 'self-pay' && hasSelfPay && fullPrice > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Option *</label>
                  <div className="space-y-2">
                    {[
                      { value: 'weekly', label: `Weekly payments (from $${minWeekly}/wk)` },
                      { value: 'full', label: `Pay in full — $${fullPrice.toLocaleString()}` },
                      { value: 'affirm', label: 'Affirm — monthly installments' },
                      { value: 'sezzle', label: 'Sezzle — 4 interest-free payments' },
                      { value: 'stripe-bnpl', label: 'Afterpay / Klarna' },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-brand-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value={opt.value}
                          checked={paymentOption === opt.value}
                          onChange={() => setPaymentOption(opt.value as typeof paymentOption)}
                          className="text-brand-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {paymentOption === 'weekly' && (
                    <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Weekly amount (min ${minWeekly})
                      </label>
                      <input
                        type="number"
                        min={minWeekly}
                        step="5"
                        value={customWeekly}
                        onChange={(e) => setCustomWeekly(Math.max(minWeekly, parseFloat(e.target.value) || minWeekly))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        20% deposit (${depositAmount.toLocaleString()}) due today, then ${customWeekly}/wk
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="w-full bg-brand-blue-700 hover:bg-brand-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                ) : formData.fundingInterest === 'self-pay' ? (
                  'Continue to Payment →'
                ) : (
                  'Submit Application →'
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                By submitting you agree to our{' '}
                <Link href="/terms" className="underline">Terms</Link> and{' '}
                <Link href="/privacy" className="underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
