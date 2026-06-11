import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_OWNER_ROLES } from '@/lib/platform/permission-levels';
import type { UserRole } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

export default async function DevStudioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = await getAdminClient();
  const client = db ?? supabase;
  const { data: profile } = await (client as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.role || !PLATFORM_OWNER_ROLES.includes(profile.role as UserRole)) {
    redirect('/unauthorized?reason=platform_operator');
  }

  return <div className="h-[calc(100vh-4rem)] min-h-[480px] overflow-hidden">{children}</div>;
}
