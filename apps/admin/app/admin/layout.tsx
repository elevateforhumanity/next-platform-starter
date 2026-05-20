import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase/admin';
import { AdminLicenseWrapper } from '@/components/licensing/AdminLicenseWrapper';
import { getLicenseAccessMode } from '@/lib/licensing/billing-authority';
import { reconcileTrialOnboarding } from '@/lib/trial/reconcile-onboarding';
import { withTimeout } from '@/lib/utils/withTimeout';
import AdminNav from '@/components/admin/AdminNav';
import { DEFAULT_NAV, isNavSections, type NavSection } from '@/lib/admin/nav-config';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';
import PWAManager from '@/components/PWAManager';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Admin Portal - Manage Programs & Operations',
  description:
    'Manage programs, students, certificates, compliance, and workforce development operations. Admin dashboard for Elevate for Humanity.',
  keywords: [
    'admin portal',
    'program management',
    'workforce administration',
    'compliance',
    'operations',
  ],
  robots: { index: false, follow: false },
  manifest: '/admin/manifest.webmanifest',
  openGraph: {
    title: 'Admin Portal | Elevate for Humanity',
    description: 'Manage programs, students, certificates, and workforce development operations.',
    images: ['/images/pages/comp-home-highlight-health.jpg'],
    type: 'website',
  },
};

async function getLicenseContext(userId: string, db: Awaited<ReturnType<typeof getAdminClient>>) {
  if (!db) return null;

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', userId)
    .maybeSingle();
  // Degrade gracefully — profile missing or RLS block should not lock out the admin portal
  if (profileError || !profile?.tenant_id) return null;

  const { data: license, error: licenseError } = await db
    .from('licenses')
    .select(
      'id, tier, status, expires_at, current_period_end, stripe_subscription_id, stripe_customer_id, canceled_at, suspended_at',
    )
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (licenseError) {
    logger.error('[getLicenseContext] license fetch failed', licenseError);
  }

  return {
    license: license ?? null,
    userRole: profile.role,
    tenantId: profile.tenant_id,
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Single auth check — user is passed to all downstream functions to avoid
  // redundant getUser() calls (was 3 separate calls per page load).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = await getAdminClient();

  // Verify admin role — if db is unavailable, fall back to supabase client
  let roleCheck: { role: string } | null = null;
  if (db) {
    const { data } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
    roleCheck = data;
  } else {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    roleCheck = data;
  }
  const adminRoles = ['super_admin'];
  if (!roleCheck || !adminRoles.includes(roleCheck.role)) redirect('/unauthorized');

  const effectiveDb = db ?? (supabase as unknown as Awaited<ReturnType<typeof getAdminClient>>);

  const [context, headerData, navSections] = await Promise.all([
    withTimeout(getLicenseContext(user.id, effectiveDb), 3000, 'getLicenseContext').catch(
      () => null,
    ),
    withTimeout(
      (async () => {
        try {
          const [profileRes, appsRes, docsRes, alertsRes, wioaDocsRes, staleLeadsRes] =
            await Promise.all([
              effectiveDb
                .from('profiles')
                .select('full_name, first_name')
                .eq('id', user.id)
                .maybeSingle(),
              effectiveDb
                .from('applications')
                .select('id', { count: 'exact', head: true })
                .in('status', ['submitted', 'in_review']),
              db
                .from('documents')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending'),
              db
                .from('compliance_alerts')
                .select('id', { count: 'exact', head: true })
                .not('status', 'eq', 'resolved'),
              db
                .from('wioa_documents')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending'),
              db
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .lt('updated_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
                .not('status', 'in', '("closed_won","closed_lost","Closed Won","Closed Lost")'),
            ]);
          // Header notification counts are non-critical — log failures but don't throw
          if (appsRes.error)
            logger.warn('[AdminLayout] applications count failed', {
              message: appsRes.error.message,
            });
          if (docsRes.error)
            logger.warn('[AdminLayout] documents count failed', { message: docsRes.error.message });

          const name =
            profileRes.data?.first_name || profileRes.data?.full_name?.split(' ')[0] || 'Admin';
          const notifs: import('@/components/admin/AdminNav').AdminNavNotif[] = [];

          if ((appsRes.count ?? 0) > 0) {
            notifs.push({
              id: 'apps',
              unread: true,
              href: '/admin/applications?status=submitted',
              title: `${appsRes.count} application${appsRes.count !== 1 ? 's' : ''} pending review`,
              time: 'Pending action',
            });
          }
          if ((docsRes.count ?? 0) > 0) {
            notifs.push({
              id: 'docs',
              unread: true,
              href: '/admin/documents/review',
              title: `${docsRes.count} document${docsRes.count !== 1 ? 's' : ''} need review`,
              time: 'Compliance required',
            });
          }
          if ((alertsRes.count ?? 0) > 0) {
            notifs.push({
              id: 'compliance',
              unread: true,
              href: '/admin/compliance',
              title: `${alertsRes.count} unresolved compliance alert${alertsRes.count !== 1 ? 's' : ''}`,
              time: 'Needs attention',
            });
          }
          if ((wioaDocsRes.count ?? 0) > 0) {
            notifs.push({
              id: 'wioa',
              unread: true,
              href: '/admin/wioa/documents',
              title: `${wioaDocsRes.count} WIOA document${wioaDocsRes.count !== 1 ? 's' : ''} awaiting review`,
              time: 'WIOA queue',
            });
          }
          if ((staleLeadsRes.count ?? 0) > 0) {
            notifs.push({
              id: 'leads',
              unread: true,
              href: '/admin/crm/leads',
              title: `${staleLeadsRes.count} CRM lead${staleLeadsRes.count !== 1 ? 's' : ''} with no activity in 5+ days`,
              time: 'Follow-up needed',
            });
          }

          return { userName: name, notifs };
        } catch {
          return { userName: 'Admin', notifs: [] };
        }
      })(),
      3000,
      'adminHeaderData',
    ).catch(() => ({
      userName: 'Admin',
      notifs: [] as import('@/components/admin/AdminNav').AdminNavNotif[],
    })),
    // Nav config — non-critical, 1s timeout, falls back to DEFAULT_NAV
    withTimeout(
      (async (): Promise<NavSection[]> => {
        const { data } = await effectiveDb
          .from('platform_settings')
          .select('value')
          .eq('key', 'ADMIN_NAV_SECTIONS_JSON')
          .maybeSingle();
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (isNavSections(parsed)) return parsed;
          } catch {
            /* fall through */
          }
        }
        return DEFAULT_NAV;
      })(),
      1000,
      'adminNavConfig',
    ).catch(() => DEFAULT_NAV),
  ]);

  // Reconcile trial onboarding — fire and forget
  if (context?.tenantId) {
    reconcileTrialOnboarding(supabase, context.tenantId).catch(() => {});
  }

  // License access enforcement — fail closed
  if (context?.license) {
    const accessResult = getLicenseAccessMode(context.license, context.userRole);

    if (accessResult.mode === 'blocked') {
      redirect(accessResult.redirectTo ?? '/admin/license-required');
    }

    if (accessResult.mode === 'blocked_billing_issue') {
      redirect(accessResult.redirectTo ?? '/admin/billing-issue');
    }
  }

  const content = (
    <div className="min-h-screen bg-white text-slate-900">
      <AdminNav
        userName={headerData.userName}
        notifs={headerData.notifs}
        navSections={navSections}
      />
      <IdleTimeoutGuard />
      <PWAManager />
      <UpdatePrompt />
      <main id="main-content" className="flex-1 overflow-x-hidden px-6 pb-6 pt-[5.5rem]">
        <div className="w-full max-w-none">{children}</div>
      </main>
    </div>
  );

  if (!context) {
    return <DemoTourProvider>{content}</DemoTourProvider>;
  }

  return (
    <DemoTourProvider>
      <AdminLicenseWrapper
        license={context.license}
        userRole={context.userRole}
        tenantId={context.tenantId}
      >
        {content}
      </AdminLicenseWrapper>
    </DemoTourProvider>
  );
}
