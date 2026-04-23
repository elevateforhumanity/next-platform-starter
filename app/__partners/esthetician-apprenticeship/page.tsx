import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import EstheticianPartnerPageClient from './PartnerPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Spa & Salon Partner Program | Indiana Esthetician Apprenticeship | Elevate for Humanity',
  description:
    'Become a host spa or salon for the Indiana Esthetician Apprenticeship program. Host apprentices, develop talent, and grow your team with structured training support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/esthetician-apprenticeship',
  },
};

export default async function EstheticianPartnerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isApproved = false;
  if (user?.email) {
    const { data: pa } = await supabase
      .from('partner_applications')
      .select('status')
      .eq('contact_email', user.email)
      .eq('status', 'approved')
      .maybeSingle();
    isApproved = !!pa;
  }

  return <EstheticianPartnerPageClient isApproved={isApproved} />;
}
