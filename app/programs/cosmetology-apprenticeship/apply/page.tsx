'use client';

import { useState } from 'react';
import ApprenticeForm from '../../barber-apprenticeship/apply/ApprenticeForm';
import PartnerShopForm from './PartnerShopForm';

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
  const [applicantType, setApplicantType] = useState<ApplicantType>('');

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
            {applicantType === 'apprentice' && <ApprenticeForm />}
            {applicantType === 'partner_shop' && <PartnerShopForm />}
          </>
        )}
      </div>
    </div>
  );
}
