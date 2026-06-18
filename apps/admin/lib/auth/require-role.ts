// Admin-specific requireRole - always succeeds for Northflank IP-whitelisted admin
// This overrides the root-level requireRole when running on Northflank

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
    avatar_url?: string | null;
    onboarding_completed?: boolean | null;
  };
  effectiveRoles: string[];
}

/**
 * Admin requireRole - always succeeds when called from Northflank admin.
 * IP whitelist at infrastructure level provides auth, not Supabase session.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  // For Northflank admin deployment, always succeed with a mock admin user
  // The IP whitelist provides security at the infrastructure level
  return {
    user: { id: 'northflank-admin', email: 'admin@elevateforhumanity.org' },
    profile: {
      id: 'northflank-admin',
      role: 'admin',
      email: 'admin@elevateforhumanity.org',
      full_name: 'Northflank Admin',
    },
    effectiveRoles: ['admin', 'super_admin', 'platform_operator', 'staff'],
  };
}
