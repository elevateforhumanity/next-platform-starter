import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import type { BasePlanId, BillingInterval } from '@/lib/store/platform-pricing';
import { licenseTierForPlan } from '@/lib/store/platform-pricing';
import { resolveEntitlements } from '@/lib/platform/entitlements';

export interface PlatformSaasCheckoutMetadata {
  user_id: string;
  tenant_id?: string;
  plan_id: BasePlanId;
  billing_interval: BillingInterval;
  addon_slugs?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

/**
 * Apply plan + add-ons to tenant license after Stripe checkout.
 */
export async function fulfillPlatformSaasSubscription(
  adminSupabase: SupabaseClient,
  meta: PlatformSaasCheckoutMetadata,
): Promise<{ ok: boolean; error?: string }> {
  const { user_id, tenant_id, plan_id, billing_interval } = meta;
  const addonSlugs = (meta.addon_slugs || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!tenant_id) {
    logger.warn('platform_saas fulfillment: no tenant_id on profile', { user_id });
    return { ok: false, error: 'No organization linked to this account' };
  }

  const entitlements = resolveEntitlements(plan_id, addonSlugs);
  const tier = licenseTierForPlan(plan_id, billing_interval);

  const { data: license, error: fetchErr } = await adminSupabase
    .from('licenses')
    .select('id, features')
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (fetchErr) {
    logger.error('platform_saas: license fetch failed', fetchErr);
    return { ok: false, error: fetchErr.message };
  }

  const licensePayload = {
    tier,
    status: 'active',
    features: entitlements.features,
    max_users: entitlements.maxUsers,
    stripe_subscription_id: meta.stripe_subscription_id ?? null,
    stripe_customer_id: meta.stripe_customer_id ?? null,
    metadata: {
      saas_plan_id: plan_id,
      billing_interval,
      addon_slugs: addonSlugs,
      max_locations: entitlements.maxLocations,
      max_contacts: entitlements.maxContacts,
      additional_storage_gb: entitlements.additionalStorageGb,
    },
    updated_at: new Date().toISOString(),
  };

  if (license?.id) {
    const { error: updateErr } = await adminSupabase
      .from('licenses')
      .update(licensePayload)
      .eq('id', license.id);
    if (updateErr) return { ok: false, error: updateErr.message };
  } else {
    const { error: insertErr } = await adminSupabase.from('licenses').insert({
      tenant_id,
      domain: 'pending-setup',
      customer_email: null,
      license_key: `saas-${tenant_id.slice(0, 8)}`,
      ...licensePayload,
    });
    if (insertErr) return { ok: false, error: insertErr.message };
  }

  for (const slug of addonSlugs) {
    const { error: addonErr } = await adminSupabase.from('organization_addons').upsert(
      {
        tenant_id,
        addon_slug: slug,
        status: 'active',
        activated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,addon_slug' },
    );
    if (addonErr) {
      logger.warn('organization_addons upsert failed', { slug, addonErr });
    }
  }

  return { ok: true };
}
