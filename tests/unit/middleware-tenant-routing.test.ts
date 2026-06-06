import { describe, expect, it } from 'vitest';
import {
  isTenantAppSubdomainHost,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';

describe('middleware tenant routing', () => {
  it('extracts slug from app subdomain', () => {
    expect(tenantSlugFromAppHost('acme.app.elevateforhumanity.org')).toBe('acme');
    expect(isTenantAppSubdomainHost('acme.app.elevateforhumanity.org')).toBe(true);
  });

  it('rejects apex and nested hosts', () => {
    expect(tenantSlugFromAppHost('app.elevateforhumanity.org')).toBeNull();
    expect(tenantSlugFromAppHost('www.elevateforhumanity.org')).toBeNull();
    expect(tenantSlugFromAppHost('foo.bar.app.elevateforhumanity.org')).toBeNull();
  });

  it('strips port from host', () => {
    expect(tenantSlugFromAppHost('demo.app.elevateforhumanity.org:3000')).toBe('demo');
  });
});
