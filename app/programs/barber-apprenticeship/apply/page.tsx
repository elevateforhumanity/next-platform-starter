'use client';

import { useState, useEffect } from 'react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ApprenticeForm from './ApprenticeForm';
import PartnerShopForm from './PartnerShopForm';

type ApplicantType = '' | 'apprentice' | 'partner_shop';

const VALID_TYPES: ApplicantType[] = ['apprentice', 'partner_shop'];

const TYPE_OPTIONS: { value: ApplicantType; label: string; desc: string }[] = [
  {
    value: 'apprentice',
    label: 'Barber Apprentice',
    desc: 'I want to enroll in the barber apprenticeship program as a student.',
  },
  {
    value: 'partner_shop',
    label: 'Partner Barbershop',
    desc: 'I own or manage a barbershop and want to host apprentices.',
  },
];

function BarberApplyPageInner() {
  const searchParams = useSafeSearchParams();
  const [applicantType, setApplicantType] = useState<ApplicantType>('');

  // This IS the canonical barber apply page. No redirect away from here.
  // Partner shop type gets its own form; apprentice (default) renders ApprenticeForm.
  useEffect(() => {
    const param = searchParams.get('type') as ApplicantType | null;
    if (param && VALID_TYPES.includes(param)) {
      setApplicantType(param);
    } else {
      // Default to apprentice — this is the primary flow
      setApplicantType('apprentice');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
              { label: 'Apply' },
            ]}
          />
          <div className="mt-4">
            <Link
              href="/programs/barber-apprenticeship"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Program
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">
            Barber Apprenticeship — Apply
          </h1>
          <p className="text-slate-600 mt-1">
            Select the application type that applies to you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Type selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <label
            htmlFor="applicant-type"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            I am applying as a… *
          </label>
          <div className="relative">
            <select
              id="applicant-type"
              value={applicantType}
              onChange={(e) => setApplicantType(e.target.value as ApplicantType)}
              className="w-full appearance-none px-4 py-3 pr-10 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-base"
            >
              <option value="">— Select application type —</option>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>

          {/* Description under selection */}
          {applicantType && (
            <p className="mt-3 text-sm text-slate-600">
              {TYPE_OPTIONS.find((o) => o.value === applicantType)?.desc}
            </p>
          )}
        </div>

        {/* Render the correct form — apprentice is the default */}
        {(applicantType === '' || applicantType === 'apprentice') && (
          <ApprenticeForm initialPayment={searchParams.get('payment')} />
        )}
        {applicantType === 'partner_shop' && <PartnerShopForm />}
      </div>
    </div>
  );
}

export default function BarberApplyPage() {
  return (<BarberApplyPageInner />);
}
