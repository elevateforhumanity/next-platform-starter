'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MIN_SETUP_FEE_CENTS,
  PAYMENT_TERM_WEEKS,
  TUITION_DOLLARS,
  weeklyPaymentCents,
} from '@/lib/cosmetology/pricing';
import { getProvidersForAmount } from '@/lib/bnpl-config';

type ApplicantType = '' | 'apprentice' | 'partner_shop';

const VALID_TYPES: ApplicantType[] = ['apprentice', 'partner_shop'];

const APPLICANT_TYPES = [
  {
    value: 'apprentice',
    label: "I'm an Apprentice",
    desc: 'I want to enroll in the cosmetology apprenticeship program.',
  },
  {
    value: 'partner_shop',
    label: 'Partner Cosmetology Academy',
    desc: 'I own or manage a salon and want to host apprentices.',
  },
];

export default function CosmetologyApplyPage() {
  const router = useRouter();
  const [applicantType, setApplicantType] = useState<ApplicantType>('');

  // Partner shops have a dedicated onboarding portal — redirect immediately
  useEffect(() => {
    if (applicantType === 'partner_shop') {
      router.push('/partners/cosmetology-partner-shop/apply');
    }
  }, [applicantType, router]);
  const minDownPayment = MIN_SETUP_FEE_CENTS / 100;
  const defaultDownPayment = Math.max(minDownPayment, 600);
  const [downPayment, setDownPayment] = useState<number>(defaultDownPayment);

  const weeklyPayment = Math.ceil(weeklyPaymentCents(downPayment) / 100);
  const clampedDownPayment = Math.max(minDownPayment, downPayment || minDownPayment);
  const remainingBalance = Math.max(0, TUITION_DOLLARS - clampedDownPayment);

  const isValid = VALID_TYPES.includes(applicantType);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {!isValid ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Apply to Cosmetology Apprenticeship</h1>
            <p className="text-slate-600 mb-8">Please select your application type to continue.</p>

            <div className="space-y-4">
              {APPLICANT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setApplicantType(type.value as ApplicantType)}
                  className="w-full text-left p-6 border-2 border-slate-200 rounded-lg hover:border-brand-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-slate-900 mb-1">{type.label}</div>
                  <div className="text-sm text-slate-600">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {applicantType === 'apprentice' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Cosmetology Apprentice Intake</h1>
                <p className="text-slate-600 mb-6">
                  Continue to the student intake form. We prefill your program as cosmetology apprenticeship.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm font-bold text-slate-900 mb-3">Payment Calculator</p>
                    <label className="block text-sm text-slate-700 mb-1">Down Payment</label>
                    <input
                      type="number"
                      min={minDownPayment}
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value || minDownPayment))}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    />
                    <div className="mt-3 text-sm text-slate-700 space-y-1">
                      <p>
                        Weekly estimate: <strong>${weeklyPayment}</strong> for {PAYMENT_TERM_WEEKS}{' '}
                        weeks
                      </p>
                      <p>
                        Remaining balance: <strong>${remainingBalance.toLocaleString()}</strong>
                      </p>
                      <p className="text-xs text-slate-500">
                        Minimum down payment is ${minDownPayment.toLocaleString()}.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm font-bold text-slate-900 mb-3">BNPL & Payment Options</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li>Pay in full (one-time payment)</li>
                      <li>Weekly payment plan (custom down payment)</li>
                      {getProvidersForAmount(TUITION_DOLLARS).map((p) => (
                        <li key={p.id}>{p.name} — {p.description}</li>
                      ))}
                    </ul>
                    <Link
                      href="/programs/cosmetology-apprenticeship/payment/bnpl"
                      className="inline-block mt-3 text-sm font-semibold text-brand-blue-600 hover:underline"
                    >
                      Compare BNPL providers →
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/apply?program=cosmetology-apprenticeship&payment=pay_in_full"
                    className="inline-block px-6 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
                  >
                    Apply — Pay in Full
                  </Link>
                  <Link
                    href="/programs/cosmetology-apprenticeship/payment-setup"
                    className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition"
                  >
                    Apply — Payment Plan
                  </Link>
                  <Link
                    href="/programs/cosmetology-apprenticeship/payment/bnpl"
                    className="inline-block px-6 py-3 border border-brand-blue-600 text-brand-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition"
                  >
                    Apply — BNPL (All Options)
                  </Link>
                  <button
                    type="button"
                    onClick={() => setApplicantType('')}
                    className="inline-block px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
            {applicantType === 'partner_shop' && (
              <div className="flex items-center justify-center py-16">
                <p className="text-slate-500 text-sm">Redirecting to partner portal…</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
