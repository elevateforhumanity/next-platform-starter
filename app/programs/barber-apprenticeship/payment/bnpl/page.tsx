import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BnplPageClient } from './BnplPageClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pay with BNPL — Barber Apprenticeship | Elevate for Humanity',
  description:
    'Split your barber apprenticeship tuition into installments with Klarna, Afterpay, Affirm, Sezzle, and more.',
  robots: { index: false, follow: false },
};

export default function BnplPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <BnplPageClient />
    </Suspense>
  );
}
