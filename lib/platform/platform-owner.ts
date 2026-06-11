import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient, requireAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/lib/rbac/role-matrix';
import {
  resolvePermissionLevel,
  PLATFORM_OWNER_ROLES,
  type PlatformPermissionLevel,
  canAccessDevStudio,
  canProvisionWorkspaces,
  canDeployCode,
} from '@/lib/platform/permission-levels';
import { logger } from '@/lib/logger';

export type PlatformUserContext = {
  userId: string;
  profileRole: UserRole | null;
  effectiveRoles: UserRole[];
  tenantId: string | null;
  isPlatformOwnerTenant: boolean;
  permissionLevel: PlatformPermissionLevel;
  canAccessDevStudio: boolean;
  canProvisionWorkspaces: boolean;
  canDeployCode: boolean;
};

/** Env override — set after migration backfill or in Northflank secret group. */
export function getPlatformOwnerTenantIdFromEnv(): string | null {
  const raw = process.env.PLATFORM_OWNER_TENANT_ID?.trim();
  return raw || null;
}

export async function fetchPlatformOwnerTenantId(): Promise<string | null> {
  const fromEnv = getPlatformOwnerTenantIdFromEnv();
  if (fromEnv) return fromEnv;

  const db = await requireAdminClient();
  if (!db) return null;

  const { data: setting } = await db
    .from('platform_settings')
    .select('value')
    .eq('key', 'PLATFORM_OWNER_TENANT_ID')
    .maybeSingle();

  if (setting?.value && typeof setting.value === 'string') {
    const trimmed = setting.value.trim();
    if (trimmed) return trimmed;
  }

  const { data: tenant } = await db
    .from('tenants')
    .select('id')
    .eq('is_platform_owner', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return tenant?.id ?? null;
}

export function isUserOnPlatformOwnerTenant(
  userTenantId: string | null | undefined,
  platformOwnerTenantId: string | null,
): boolean {
  if (!userTenantId || !platformOwnerTenantId) return false;
  return userTenantId === platformOwnerTenantId;
}

async function loadProfileForPlatformContext(
  userId: string,
): Promise<{ role: UserRole | null; effectiveRoles: UserRole[]; tenant_id: string | null } | null> {
  const adminDb = await getAdminClient();
  if (adminDb) {
    const { data, error } = await adminDb
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) {
      const role = (data.role as UserRole | null) ?? null;
      const effectiveRoles = await loadSecondaryRoles(adminDb, userId, role);
      return {
        role,
        effectiveRoles,
        tenant_id: (data.tenant_id as string | null) ?? null,
      };
    }
  }

  const sessionDb = await createClient();
  const { data, error } = await sessionDb
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const role = (data.role as UserRole | null) ?? null;
  const effectiveRoles = await loadSecondaryRoles(sessionDb, userId, role);
  return {
    role,
    effectiveRoles,
    tenant_id: (data.tenant_id as string | null) ?? null,
  };
}


async function loadSecondaryRoles(
  db: Awaited<ReturnType<typeof getAdminClient>> | Awaited<ReturnType<typeof createClient>>,
  userId: string,
  primaryRole: UserRole | null,
): Promise<UserRole[]> {
  const roles = new Set<UserRole>();
  if (primaryRole) roles.add(primaryRole);

  try {
    // Fetch both the FK-joined role name and the denormalized `role` column.
    // The FK join `roles(name)` can fail if the relationship is broken or the
    // roles table is missing rows — the direct `role` TEXT column is the fallback.
    const { data } = await (db as any)
      .from('user_roles')
      .select('role, roles(name)')
      .eq('user_id', userId);

    for (const row of data ?? []) {
      // Prefer FK-joined name
      const joinedRole = (row as { roles?: { name?: unknown } | null }).roles?.name;
      if (typeof joinedRole === 'string' && joinedRole.trim()) {
        roles.add(joinedRole.trim() as UserRole);
      }
      // Fallback: direct role column on user_roles
      const directRole = (row as { role?: unknown }).role;
      if (typeof directRole === 'string' && directRole.trim()) {
        roles.add(directRole.trim() as UserRole);
      }
    }
  } catch {
    // Secondary roles are optional. Keep primary role behavior if the join/table is unavailable.
  }

  return Array.from(roles);
}

function resolveHighestPlatformPermissionLevel(params: {
  effectiveRoles: UserRole[];
  isPlatformOwnerTenant: boolean;
}): PlatformPermissionLevel {
  const levels = params.effectiveRoles.map((role) =>
    resolvePermissionLevel({
      profileRole: role,
      isPlatformOwnerTenant: params.isPlatformOwnerTenant,
    }),
  );

  if (levels.includes('platform_owner')) return 'platform_owner';
  if (levels.includes('platform_admin')) return 'platform_admin';
  if (levels.includes('organization_admin')) return 'organization_admin';
  return 'standard_user';
}

/** Load platform permission context for the current session user. */
export async function getPlatformUserContext(userId: string): Promise<PlatformUserContext | null> {
  const [profile, ownerTenantId] = await Promise.all([
    loadProfileForPlatformContext(userId),
    fetchPlatformOwnerTenantId(),
  ]);

  if (!profile) return null;

  const profileRole = profile.role;
  const effectiveRoles = profile.effectiveRoles.length ? profile.effectiveRoles : profileRole ? [profileRole] : [];
  const tenantId = profile.tenant_id;
  const onOwnerTenant = isUserOnPlatformOwnerTenant(tenantId, ownerTenantId);
  const permissionLevel = resolveHighestPlatformPermissionLevel({
    effectiveRoles,
    isPlatformOwnerTenant: onOwnerTenant,
  });

  return {
    userId,
    profileRole,
    effectiveRoles,
    tenantId,
    isPlatformOwnerTenant: onOwnerTenant,
    permissionLevel,
    canAccessDevStudio: canAccessDevStudio(permissionLevel),
    canProvisionWorkspaces: canProvisionWorkspaces(permissionLevel),
    canDeployCode: canDeployCode(permissionLevel),
  };
}

/** Session-scoped helper for server components and API routes. */
export async function getCurrentPlatformUserContext(): Promise<PlatformUserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getPlatformUserContext(user.id);
}

export async function requirePlatformOperatorContext(): Promise<PlatformUserContext | null> {
  const ctx = await getCurrentPlatformUserContext();
  if (ctx?.canAccessDevStudio) return ctx;

  // Defensive fallback — if the full context resolved but canAccessDevStudio
  // is false due to a tenant-membership or permission-level edge case, check
  // whether the user holds a platform-owner-level role directly and override.
  if (ctx && ctx.profileRole && PLATFORM_OWNER_ROLES.includes(ctx.profileRole)) {
    logger.warn('[requirePlatformOperatorContext] canAccessDevStudio was false; granting via direct role match', { role: ctx.profileRole });
    return {
      ...ctx,
      permissionLevel: 'platform_owner',
      canAccessDevStudio: true,
      canProvisionWorkspaces: true,
      canDeployCode: true,
    };
  }

  // Second fallback — context itself was null (profile load or auth failed).
  // Try a lightweight direct check so super_admin users are never locked out.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const db = await getAdminClient();
    const client = db ?? supabase;
    const { data: profile } = await (client as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role && PLATFORM_OWNER_ROLES.includes(profile.role as UserRole)) {
      logger.warn('[requirePlatformOperatorContext] full context was null; granting via direct profile role', { role: profile.role });
      return {
        userId: user.id,
        profileRole: profile.role as UserRole,
        effectiveRoles: [profile.role as UserRole],
        tenantId: null,
        isPlatformOwnerTenant: false,
        permissionLevel: 'platform_owner',
        canAccessDevStudio: true,
        canProvisionWorkspaces: true,
        canDeployCode: true,
      };
    }
  } catch (err) {
    logger.error('[requirePlatformOperatorContext] fallback check failed', err instanceof Error ? err : new Error(String(err)));
  }

  return null;
}

export async function requirePlatformStaffContext(): Promise<PlatformUserContext | null> {
  const ctx = await getCurrentPlatformUserContext();
  if (!ctx) return null;
  if (ctx.permissionLevel === 'platform_owner' || ctx.permissionLevel === 'platform_admin') {
    return ctx;
  }
  // Defensive: super_admin/platform_operator are always platform staff regardless of tenant.
  if (ctx.profileRole && PLATFORM_OWNER_ROLES.includes(ctx.profileRole)) {
    return {
      ...ctx,
      permissionLevel: 'platform_owner',
      canAccessDevStudio: true,
      canProvisionWorkspaces: true,
      canDeployCode: true,
    };
  }
  return null;
}
