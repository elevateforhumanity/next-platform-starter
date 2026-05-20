import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Shared auth guard for all /portal/* routes.
 * Role enforcement is handled per-portal in each portal's own layout.
 */
export default async function PortalRootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/portal/apprentice');
  }

  return <>{children}</>;
}
