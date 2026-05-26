import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/require-user';
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

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser({
    allowedRoles: ['partner', 'admin', 'super_admin', 'org_admin', 'staff'],
  });

  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin ?? supabase;

  const { data: profile } = await db
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  // Resolve org name from partner_users → partners join
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
      role={profile?.role ?? 'partner'}
      userName={profile?.full_name ?? user.email ?? ''}
      userEmail={profile?.email ?? user.email ?? ''}
      orgName={orgName}
    >
      {children}
    </PartnerProgramHolderShell>
  );
}
