export const dynamic = 'force-static';

import AddOnCheckout from '@/components/store/AddOnCheckout';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


export default function ProposalWritingAssistantCheckoutPage() {
  return (
    <AddOnCheckout
      productId="proposal-writing-assistant"
      productName="Proposal Writing Assistant"
      productImage="/images/pages/admin-analytics-hero.webp"
      backHref="/store/add-ons/proposal-writing-assistant"
      oneTimePrice={1497}
      monthlyPrice={424}
      monthlyCount={4}
      accentColor="purple"
      features={['AI-powered drafting', 'Program data integration', 'Compliance record access', 'Grant-ready templates']}
    />
  );
}
