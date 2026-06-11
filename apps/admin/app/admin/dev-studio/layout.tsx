import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PERMISSIONS } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

export default async function DevStudioLayout({ children }: { children: React.ReactNode }) {
  // Parent /admin/layout.tsx handles authentication.
  // This layout enforces the Dev Studio role gate: only super_admin and platform_operator.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('role, roles(name)')
    .eq('user_id', user.id);

  const secondaryRoles = (userRoleRows || [])
    .flatMap((r: any) => [r.roles?.name, r.role])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '');

  const effectiveRoles = Array.from(new Set([profile?.role, ...secondaryRoles].filter(Boolean)));
  const allowed = effectiveRoles.some((r) => PERMISSIONS.access_devstudio.includes(r as any));

  if (!allowed) {
    redirect('/unauthorized?reason=devstudio_requires_platform_role');
  }

  return <div className="h-[calc(100vh-4rem)] min-h-[480px] overflow-hidden">{children}</div>;
}
