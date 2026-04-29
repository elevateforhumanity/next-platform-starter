import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import EstheticianPartnerPageClient from './PartnerPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Esthetician Apprenticeship — Host a Spa or Salon Partner | Elevate for Humanity',
  description: 'Host an esthetician apprentice at your spa or salon. DOL Registered Apprenticeship. Elevate handles theory training, DOL compliance, and IPLA licensing coordination.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/esthetician-apprenticeship' },
};

export default async function EstheticianPartnerPage() {
  let isApproved = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('partner_applications')
        .select('status')
        .eq('user_id', user.id)
        .eq('program_type', 'esthetician-apprenticeship')
        .maybeSingle();
      isApproved = data?.status === 'approved';
    }
  } catch {
    // unauthenticated — show public page
  }
  return <EstheticianPartnerPageClient isApproved={isApproved} />;
}
