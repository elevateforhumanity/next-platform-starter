import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Apprentice Portal — Elevate for Humanity',
  description: 'Track your apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['student', 'admin', 'super_admin', 'staff', 'instructor'];

export default async function ApprenticePortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/portal/apprentice');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
