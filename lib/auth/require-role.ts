import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    role: string;
    organization_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
}

/**
 * Require user to have one of the specified roles.
 * Redirects to /login?redirect=<current-path> if not authenticated.
 * Redirects to /unauthorized if authenticated but wrong role.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Preserve the requested path so login can return the user here
    const headersList = await headers();
    const rawUrl =
      headersList.get('x-pathname') ||
      headersList.get('x-url') ||
      headersList.get('x-invoke-path') ||
      headersList.get('referer') ||
      '';
    let returnPath = '/learner/dashboard';
    if (rawUrl) {
      try {
        const u = new URL(rawUrl, 'http://localhost');
        returnPath = u.pathname + (u.search || '');
      } catch {
        // malformed — use default
      }
    }
    // Admin app has no /login page — redirect to /admin-login on the LMS.
    // SERVICE_ROLE=admin is set in the admin ECS task definition.
    const loginPath =
      process.env.SERVICE_ROLE === 'admin'
        ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/admin-login?redirect=${encodeURIComponent(returnPath)}`
        : `/login?redirect=${encodeURIComponent(returnPath)}`;
    redirect(loginPath);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Primary role check
  const primaryAllowed = profile && allowedRoles.includes(profile.role);

  // Secondary role check via user_roles table (multi-role users)
  let secondaryAllowed = false;
  if (!primaryAllowed && profile) {
    const { data: userRoleRows } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);
    const secondaryRoles = (userRoleRows || [])
      .map((r: any) => r.roles?.name)
      .filter(Boolean);
    secondaryAllowed = secondaryRoles.some((r: string) => allowedRoles.includes(r));
  }

  if (!profile || (!primaryAllowed && !secondaryAllowed)) {
    const unauthorizedPath =
      process.env.SERVICE_ROLE === 'admin'
        ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}/unauthorized`
        : '/unauthorized';
    redirect(unauthorizedPath);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  };
}

/**
 * Check if user has specific role (returns boolean, doesn't redirect)
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return (
    profile?.role === requiredRole || profile?.role === 'admin' || profile?.role === 'super_admin'
  );
}
