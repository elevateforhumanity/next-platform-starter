'use client';

import { useSearchParams } from 'next/navigation';
import ApprenticeForm from './ApprenticeForm';

// Reads ?payment= from the URL and passes it to ApprenticeForm as initialPayment.
// Links from the program page use ?payment=pay_in_full or ?payment=payment_plan.
export default function BarberApplyClient() {
  const searchParams = useSearchParams();
  const payment = searchParams.get('payment');
  return <ApprenticeForm initialPayment={payment} />;
}
