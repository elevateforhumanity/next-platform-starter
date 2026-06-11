import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { resolveAuthenticatedLandingDestination } from '@/lib/auth/landing-destination';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  alternates: { canonical: 'https://www.elevateforhumanity.org/dashboard' },
};

/**
 * Role-based dashboard router.
 * Destinations are defined in lib/auth/role-destinations.ts — edit there, not here.
 */
export default async function DashboardRouterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const landing = await resolveAuthenticatedLandingDestination(supabase, user);
  redirect(landing.redirectTo);
}
