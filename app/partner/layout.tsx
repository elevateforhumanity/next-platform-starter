import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !PORTAL_ROLES.includes(profile.role ?? '')) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
