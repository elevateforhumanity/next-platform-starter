import type { Metadata } from 'next';
import { Suspense } from 'react';
import BarberApplyClient from './BarberApplyClient';

export const metadata: Metadata = {
  title: 'Apply — Barber Apprenticeship | Elevate for Humanity',
  description:
    'Apply for the Barber Apprenticeship program at Elevate for Humanity. Flexible payment options available.',
  robots: { index: false },
};

export default function BarberApplyPage() {
  return (
    <Suspense>
      <BarberApplyClient />
    </Suspense>
  );
}
