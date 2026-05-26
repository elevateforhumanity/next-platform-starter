import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PartnerProgramHolderShell } from '@/components/portal/PartnerProgramHolderShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: 'Host Site Portal | Elevate for Humanity',
    template: '%s | Host Site Portal',
  },
  description: 'Manage your host site partnership with Elevate for Humanity.',
};

const PORTAL_ROLES = ['partner', 'program_holder', 'admin', 'super_admin', 'staff', 'org_admin'];

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/partner/dashboard');

  const db = await requireAdminClient() ?? supabase;

  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !PORTAL_ROLES.includes(profile.role ?? '')) {
    redirect('/unauthorized');
  }

  // Resolve org name from partner_users → partners
  let orgName: string | undefined;
  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partners(name, organization_name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  const partnerRow = (partnerLink?.partners as any);
  orgName = partnerRow?.organization_name ?? partnerRow?.name ?? undefined;

  return (
    <PartnerProgramHolderShell
      role={profile.role}
      userName={profile.full_name ?? user.email ?? ''}
      userEmail={profile.email ?? user.email ?? ''}
      orgName={orgName}
    >
      {children}
    </PartnerProgramHolderShell>
  );
}
