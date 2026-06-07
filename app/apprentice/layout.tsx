import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  ApprenticeSubNav,
  resolveApprenticeNavConfig,
} from '@/components/portal/ApprenticeSubNav';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { canAccessApprenticeTools } from '@/lib/portal/apprentice-access';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Apprentice Portal',
  description: 'Apprentice dashboard, hours, documents, and training.',
};
export const dynamic = 'force-dynamic';

/** Routes that must stay reachable when tuition is past due (payment method update only). */
const BILLING_EXEMPT_PREFIXES = ['/apprentice/billing'];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/apprentice';

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!canAccessApprenticeTools(profile?.role)) {
    redirect('/unauthorized');
  }
  const isBillingExempt = BILLING_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  const db = await getAdminClient();
  if (db && !isBillingExempt) {
    const { data: barberSub } = await db
      .from('barber_subscriptions')
      .select('payment_status, suspension_deadline')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isSuspended =
      barberSub?.payment_status === 'suspended' ||
      (barberSub?.payment_status === 'past_due' &&
        !!barberSub.suspension_deadline &&
        new Date(barberSub.suspension_deadline) < new Date());

    if (isSuspended) {
      redirect('/billing-required?reason=payment_failed');
    }
  }

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  const nav = resolveApprenticeNavConfig(programSlug);

  return (
    <div className="min-h-screen bg-slate-50">
      {nav && <ApprenticeSubNav programSlug={nav.programSlug} config={nav.config} />}
      {children}
    </div>
  );
}
