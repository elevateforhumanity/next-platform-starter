export const dynamic = 'force-static';

import AddOnCheckout from '@/components/store/AddOnCheckout';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


export default function WorkforceGrantOperationsHubCheckoutPage() {
  return (
    <AddOnCheckout
      productId="workforce-grant-operations-hub"
      productName="Workforce Grant Operations Hub"
      productImage="/images/pages/admin-analytics-hero.webp"
      backHref="/store/add-ons/workforce-grant-operations-hub"
      oneTimePrice={1997}
      monthlyPrice={499}
      monthlyCount={4}
      accentColor="emerald"
      features={['Grant lifecycle tracking', 'Renewal workflows', 'Multi-fund source support', 'Reporting dashboards']}
    />
  );
}
