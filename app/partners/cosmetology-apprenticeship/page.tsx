import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CosmetologyPartnerPageClient from './PartnerPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Salon Partner Program | Indiana Cosmetology Apprenticeship | Elevate for Humanity',
  description:
    'Become a host salon for the Indiana Cosmetology Apprenticeship program. Host apprentices, develop talent, and grow your team with structured training support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/cosmetology-apprenticeship',
  },
  openGraph: {
    title: 'Salon Partner Program | Indiana Cosmetology Apprenticeship',
    description: 'Host apprentices and develop talent for your salon with structured training support.',
    url: 'https://www.elevateforhumanity.org/partners/cosmetology-apprenticeship',
  },
};

export default async function CosmetologyPartnerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isApproved = false;
  if (user?.email) {
    // Check both application tables — cosmetology uses partner_applications,
    // may also have entries in barbershop_partner_applications for cross-program applicants
    const { data: pa } = await supabase
      .from('partner_applications')
      .select('status')
      .eq('contact_email', user.email)
      .eq('status', 'approved')
      .maybeSingle();
    isApproved = !!pa;
  }

  return <CosmetologyPartnerPageClient isApproved={isApproved} />;
}
