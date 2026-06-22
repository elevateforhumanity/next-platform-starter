import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Program Holder Dashboard',
};

export default async function ProgramHolderDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/dashboard');
  }

  // Redirect to partner dashboard (shared)
  redirect('/partner/dashboard');
}
