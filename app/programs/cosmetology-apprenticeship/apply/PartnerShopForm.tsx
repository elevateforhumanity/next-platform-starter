'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function PartnerShopForm() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Partner Salon Application</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Use the Dedicated Partner Application</p>
            <p>Partner onboarding is handled on the cosmetology partner portal. Continue there to submit your full application and required documents.</p>
            <p className="mt-2">
              <strong>Email:</strong> elevate4humanityedu@gmail.com<br />
              <strong>Phone:</strong> (317) 314-3757
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-8">
        <h2 className="font-semibold text-slate-900 mb-4">Next Steps</h2>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>Review the partner handbook and requirements</li>
          <li>Contact our partner coordinator</li>
          <li>Complete the full application process</li>
          <li>Sign the Memorandum of Understanding (MOU)</li>
          <li>Begin hosting cosmetology apprentices</li>
        </ol>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/programs/cosmetology-apprenticeship/apply"
          className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
        >
          Back
        </Link>
        <Link
          href="/partners/cosmetology-partner-shop/apply"
          className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
        >
          Go to Partner Application
        </Link>
      </div>
    </div>
  );
}
