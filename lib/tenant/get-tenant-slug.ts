import { headers } from 'next/headers';
import { requireAdminClient } from '@/lib/supabase/admin';
import { tenantSlugFromAppHost } from '@/lib/tenant/middleware-tenant-routing';

async function resolveSlugFromCustomDomain(host: string): Promise<string | null> {
  const domain = host.trim().toLowerCase();
  if (!domain || domain.includes('elevateforhumanity.org') || domain === 'localhost') {
    return null;
  }

  const db = await requireAdminClient();

  const { data: rpcData } = await db
    .rpc('get_tenant_by_domain', { p_domain: domain })
    .maybeSingle();

  if (rpcData && typeof rpcData === 'object') {
    const row = rpcData as { organization_id?: string; organization_name?: string };
    if (row.organization_id) {
      const { data: org } = await db
        .from('organizations')
        .select('slug')
        .eq('id', row.organization_id)
        .maybeSingle();
      if (org?.slug) return org.slug;
    }
  }

  const { data: domainRow } = await db
    .from('tenant_domains')
    .select('organization_id, domain, status, verified, is_active')
    .eq('domain', domain)
    .maybeSingle();

  if (domainRow?.organization_id) {
    const active =
      domainRow.status === 'active' ||
      domainRow.verified === true ||
      domainRow.is_active === true;
    if (active) {
      const { data: org } = await db
        .from('organizations')
        .select('slug')
        .eq('id', domainRow.organization_id)
        .maybeSingle();
      if (org?.slug) return org.slug;
    }
  }

  const { data: website } = await db
    .from('user_websites')
    .select('subdomain')
    .eq('custom_domain', domain)
    .eq('is_published', true)
    .maybeSingle();

  return website?.subdomain ?? null;
}

export async function getTenantSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  const slug = h.get('x-tenant-slug');
  if (slug?.trim()) return slug.trim();

  const host = h.get('x-tenant-host') ?? h.get('host');
  if (!host) return null;

  const fromApp = tenantSlugFromAppHost(host);
  if (fromApp) return fromApp;

  return resolveSlugFromCustomDomain(host);
}
