'use client';

import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import ApprenticeForm from './ApprenticeForm';

// Reads ?payment= and ?reason= from the URL.
// ?reason=payment_required is set when orientation redirects back due to no payment on file.
export default function BarberApplyClient() {
  const searchParams = useSafeSearchParams();
  const payment = searchParams.get('payment');
  const reason = searchParams.get('reason');

  return (
    <>
      {reason === 'payment_required' && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-sm font-medium">
            Payment is required to access orientation. Please complete your enrollment below.
          </div>
        </div>
      )}
      <ApprenticeForm initialPayment={payment} />
    </>
  );
}
