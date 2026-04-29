import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import NailPartnerPageClient from './PartnerPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nail Technician Apprenticeship — Host a Nail Salon Partner | Elevate for Humanity',
  description: 'Host a nail technician apprentice at your salon. DOL Registered Apprenticeship. Elevate handles theory training, DOL compliance, and IPLA licensing coordination.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/nail-technician-apprenticeship' },
};

export default async function NailPartnerPage() {
  let isApproved = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('partner_applications')
        .select('status')
        .eq('user_id', user.id)
        .eq('program_type', 'nail-technician-apprenticeship')
        .maybeSingle();
      isApproved = data?.status === 'approved';
    }
  } catch {
    // unauthenticated — show public page
  }
  return <NailPartnerPageClient isApproved={isApproved} />;
}
