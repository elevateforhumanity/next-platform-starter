import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { fetchPlatformOwnerTenantId } from '@/lib/platform/platform-owner';
import { enqueueJob } from '@/lib/jobs/queue';
import type { WorkspaceSubscriptionTier } from '@/lib/workspace/tier-limits';

export type ProvisionWorkspaceParams = {
  displayName: string;
  slug: string;
  subscriptionTier: WorkspaceSubscriptionTier;
  templateSlug?: string;
  provisionedByUserId: string;
  contactEmail?: string;
};

export type ProvisionWorkspaceResult =
  | {
      ok: true;
      workspaceId: string;
      tenantId: string;
      organizationId: string;
      status: 'pending' | 'provisioning';
      workspaceUrl: string | null;
    }
  | { ok: false; error: string };

function workspacePublicUrl(slug: string): string {
  const host = process.env.ELEVATE_DEV_CLOUD_HOST || 'elevatedev.ai';
  return `https://${slug}.${host}`;
}

/**
 * Phase 1: creates customer tenant + organization + customer_workspaces row.
 * Phase 2+ (async job): GitHub fork, Northflank project, Supabase project, deploy.
 */
export async function provisionWorkspace(
  params: ProvisionWorkspaceParams,
): Promise<ProvisionWorkspaceResult> {
  const db = await requireAdminClient();
  if (!db) {
    return { ok: false, error: 'Database unavailable' };
  }

  const slug = params.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!slug || slug.length < 2) {
    return { ok: false, error: 'Invalid workspace slug' };
  }

  const ownerTenantId = await fetchPlatformOwnerTenantId();
  if (!ownerTenantId) {
    return { ok: false, error: 'Platform owner tenant is not configured' };
  }

  const templateSlug = params.templateSlug ?? 'workforce-platform-v1';
  const workspaceUrl = workspacePublicUrl(slug);

  const { data: existing } = await db
    .from('customer_workspaces')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) {
    return { ok: false, error: 'Workspace slug already exists' };
  }

  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .insert({
      name: params.displayName,
      slug,
      status: 'active',
      type: 'customer',
      is_platform_owner: false,
      parent_tenant_id: ownerTenantId,
    })
    .select('id')
    .maybeSingle();

  if (tenantError || !tenant?.id) {
    logger.error('[provisionWorkspace] tenant insert failed', tenantError);
    return { ok: false, error: 'Failed to create customer tenant' };
  }

  const { data: org, error: orgError } = await db
    .from('organizations')
    .insert({
      name: params.displayName,
      slug,
      type: 'training_provider',
      tenant_id: tenant.id,
      status: 'active',
      contact_email: params.contactEmail ?? null,
    })
    .select('id')
    .maybeSingle();

  if (orgError || !org?.id) {
    await db.from('tenants').delete().eq('id', tenant.id);
    logger.error('[provisionWorkspace] organization insert failed', orgError);
    return { ok: false, error: 'Failed to create organization' };
  }

  const { data: workspace, error: workspaceError } = await db
    .from('customer_workspaces')
    .insert({
      tenant_id: tenant.id,
      organization_id: org.id,
      slug,
      display_name: params.displayName,
      subscription_tier: params.subscriptionTier,
      template_slug: templateSlug,
      status: 'provisioning',
      workspace_url: workspaceUrl,
      provisioned_by: params.provisionedByUserId,
      metadata: {
        contact_email: params.contactEmail ?? null,
        phase: 1,
      },
    })
    .select('id')
    .maybeSingle();

  if (workspaceError || !workspace?.id) {
    await db.from('organizations').delete().eq('id', org.id);
    await db.from('tenants').delete().eq('id', tenant.id);
    logger.error('[provisionWorkspace] customer_workspaces insert failed', workspaceError);
    return { ok: false, error: 'Failed to create workspace record' };
  }

  try {
    await enqueueJob({
      jobType: 'workspace_provision',
      correlationId: `workspace:${workspace.id}`,
      tenantId: tenant.id,
      payload: {
        workspace_id: workspace.id,
        tenant_id: tenant.id,
        organization_id: org.id,
        slug,
        template_slug: templateSlug,
        subscription_tier: params.subscriptionTier,
      },
    });
  } catch (err) {
    logger.warn('[provisionWorkspace] job enqueue failed — workspace row created', {
      workspaceId: workspace.id,
      err,
    });
  }

  logger.info('[provisionWorkspace] workspace created', {
    workspaceId: workspace.id,
    tenantId: tenant.id,
    slug,
  });

  return {
    ok: true,
    workspaceId: workspace.id,
    tenantId: tenant.id,
    organizationId: org.id,
    status: 'provisioning',
    workspaceUrl,
  };
}
