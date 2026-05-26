import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CosmetologyHostShopClient from './CosmetologyHostShopClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Host a Cosmetology Apprenticeship | Elevate for Humanity',
  description:
    'Become a host salon for the Indiana Cosmetology Apprenticeship. Apply, complete onboarding, and host apprentices at your salon.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/cosmetology-apprenticeship',
  },
  openGraph: {
    title: 'Host a Cosmetology Apprenticeship',
    description: 'Host apprentices and grow your salon through Indiana\'s DOL Registered Cosmetology Apprenticeship.',
    url: 'https://www.elevateforhumanity.org/partners/cosmetology-apprenticeship',
  },
};

export default async function CosmetologyApprenticeshipPartnerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isApproved = false;
  if (user?.email) {
    const { data: app } = await supabase
      .from('host_shop_applications')
      .select('status')
      .eq('email', user.email)
      .eq('status', 'approved')
      .maybeSingle();
    isApproved = !!app;
  }

  return <CosmetologyHostShopClient isApproved={isApproved} />;
}
