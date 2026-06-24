export const dynamic = 'force-static';

import AddOnCheckout from '@/components/store/AddOnCheckout';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


export default function GrantContractSuiteCheckoutPage() {
  return (
    <AddOnCheckout
      productId="grant-contract-suite"
      productName="Grant & Contract Automation Suite"
      productImage="/images/pages/admin-analytics-hero.webp"
      backHref="/store/add-ons/grant-contract-suite"
      oneTimePrice={1997}
      monthlyPrice={499}
      monthlyCount={4}
      accentColor="blue"
      features={['AI document extraction', 'Org data prefill', 'E-signature integration', 'Export to any format']}
    />
  );
}
