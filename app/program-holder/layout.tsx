import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PartnerProgramHolderShell } from '@/components/portal/PartnerProgramHolderShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Portal',
  description: 'Manage your training programs, students, and compliance.',
  manifest: '/manifest-program-holder.json',
};

const PORTAL_ROLES = ['program_holder', 'admin', 'super_admin', 'staff', 'org_admin'];

export default async function ProgramHolderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/program-holder/dashboard');

  const db = await requireAdminClient() ?? supabase;

  const { data: profile } = await db
    .from('profiles')
    .select('id, role, full_name, email, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !PORTAL_ROLES.includes(profile.role ?? '')) {
    redirect('/unauthorized');
  }

  const isAdmin = ['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role ?? '');

  let orgName: string | undefined;
  let hasSchoolApplications = isAdmin;

  if (profile.program_holder_id) {
    const { data: holder } = await db
      .from('program_holders')
      .select('status, organization_name, name, features')
      .eq('id', profile.program_holder_id)
      .maybeSingle();

    // Block non-admins whose holder is not yet approved
    if (!isAdmin && holder && !['approved', 'active'].includes(holder.status ?? '')) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-md w-full p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Pending Approval</h1>
            <p className="text-slate-600 text-sm mb-4">
              Your account is under review. You will receive an email once approved.
            </p>
            <a href="/api/auth/signout" className="text-sm text-slate-500 hover:text-slate-800 underline">Sign out</a>
          </div>
        </div>
      );
    }

    orgName = (holder as any)?.organization_name ?? (holder as any)?.name ?? undefined;
    hasSchoolApplications = isAdmin || (holder as any)?.features?.school_applications === true;
  }

  return (
    <PartnerProgramHolderShell
      role={profile.role}
      userName={profile.full_name ?? user.email ?? ''}
      userEmail={profile.email ?? user.email ?? ''}
      orgName={orgName}
      hasSchoolApplications={hasSchoolApplications}
    >
      {children}
    </PartnerProgramHolderShell>
  );
}
