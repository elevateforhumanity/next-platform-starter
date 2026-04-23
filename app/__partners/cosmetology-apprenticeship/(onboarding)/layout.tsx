import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// All routes under (onboarding) require:
// 1. Authenticated user
// 2. Allowed role (admins/staff bypass approval check)
// 3. Approved application in partner_applications
export default async function CosmetologyOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partners/cosmetology-apprenticeship/sign-mou');
  }

  const db = getAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const adminRoles = ['admin', 'super_admin', 'staff'];
  const partnerRoles = ['program_holder', 'employer', 'partner'];
  const allowed = [...adminRoles, ...partnerRoles];

  if (!profile || !allowed.includes(profile.role)) {
    redirect('/partners/cosmetology-apprenticeship');
  }

  // Admins and staff bypass the approval check
  if (adminRoles.includes(profile.role)) {
    return <>{children}</>;
  }

  // Partner/employer/program_holder must have an approved application
  const { data: pa } = await db
    .from('partner_applications')
    .select('status')
    .eq('contact_email', user.email!)
    .eq('status', 'approved')
    .maybeSingle();

  if (!pa) {
    // Authenticated but application not yet approved
    redirect('/partners/cosmetology-apprenticeship?status=pending');
  }

  return <>{children}</>;
}
