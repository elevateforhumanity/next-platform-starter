export const dynamic = 'force-static';
export const revalidate = 3600;

import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';
import SfcTrustBar from '@/components/supersonic/SfcTrustBar';
import RefundCalculatorClient from './RefundCalculatorClient';

export default function CalculatorPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-4.jpg"
        alt="Person using a laptop to calculate their tax refund"
        title="Free Refund Calculator"
        subtitle="Estimate your federal tax refund in under 2 minutes."
      />
      <RefundCalculatorClient />
      <SfcTrustBar />
    </>
  );
}
