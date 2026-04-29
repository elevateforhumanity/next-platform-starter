import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin', 'staff'] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !ADMIN_ROLES.includes(profile.role as AdminRole)) {
    redirect('/unauthorized');
  }

  return user;
}

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return !!profile && ADMIN_ROLES.includes(profile.role as AdminRole);
  } catch {
    return false;
  }
}
