import type { Metadata } from 'next';
import { BnplPageClient } from './BnplPageClient';

export const metadata: Metadata = {
  title: 'CPR & First Aid — Pay with BNPL',
  description: 'Complete CPR & First Aid enrollment with Buy Now, Pay Later or card.',
  robots: { index: true, follow: true },
};

export default function CprBnplPage() {
  return <BnplPageClient />;
}
