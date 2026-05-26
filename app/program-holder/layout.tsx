import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PartnerProgramHolderShell } from '@/components/portal/PartnerProgramHolderShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Portal',
  description: 'Manage your training programs, students, and compliance.',
  manifest: '/manifest-program-holder.json',
};

export default async function ProgramHolderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const db = await requireAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-700">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, just render children (for public landing page)
  if (!user) {
    return <>{children}</>;
  }

  // Check approval status — block access to all portal pages until admin approves
  const { data: profile } = await db
    .from('profiles')
    .select('role, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  // Allow admins and staff through unconditionally
  const isAdmin = ['admin', 'super_admin', 'staff'].includes(profile?.role ?? '');

  if (!isAdmin && profile?.program_holder_id) {
    const { data: holder } = await db
      .from('program_holders')
      .select('status, approved_at')
      .eq('id', profile.program_holder_id)
      .maybeSingle();

    const isPending =
      !holder || !['approved', 'active'].includes(holder?.status ?? '') || !holder?.approved_at;

    if (isPending) {
      // Only allow onboarding pages while pending — block everything else
      // Children will be the pending approval page rendered below
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm max-w-md w-full p-8 text-center">
            <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Thank You for Your Submission</h1>
            <p className="text-slate-700 text-sm mb-4">
              We have received your application and our team is currently reviewing your
              information. Once your account has been approved, you will receive an email with your
              next steps and access to your program holder portal.
            </p>
            <p className="text-slate-700 text-xs mb-6">
              Questions? Contact us at{' '}
              <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 underline">
                elevate4humanityedu@gmail.com
              </a>
            </p>
            <a
              href="/api/auth/signout"
              className="inline-block text-sm text-slate-700 hover:text-slate-900 underline"
            >
              Sign out
            </a>
          </div>
        </div>
      );
    }
  }

  const PORTAL_ROLES = ['program_holder', 'admin', 'super_admin', 'staff'];

  // Non-portal roles (public visitors, unapproved applicants) — render children only
  if (!profile || !PORTAL_ROLES.includes(profile.role)) {
    return <>{children}</>;
  }

  // Single query — fetch everything needed for the shell
  const [{ data: profileFull }, { data: holderRow }] = await Promise.all([
    db.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle(),
    profile?.program_holder_id
      ? db.from('program_holders').select('organization_name, name, features').eq('id', profile.program_holder_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const orgName: string | undefined =
    (holderRow as any)?.organization_name ?? (holderRow as any)?.name ?? undefined;
  const hasSchoolApplications =
    isAdmin || (holderRow as any)?.features?.school_applications === true;

  return (
    <PartnerProgramHolderShell
      role={profile.role}
      userName={profileFull?.full_name ?? user.email ?? ''}
      userEmail={profileFull?.email ?? user.email ?? ''}
      orgName={orgName}
      hasSchoolApplications={hasSchoolApplications}
    >
      {children}
    </PartnerProgramHolderShell>
  );
}
