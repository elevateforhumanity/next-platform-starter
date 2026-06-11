import { describe, expect, it } from 'vitest';
import {
  isTenantAppSubdomainHost,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

  it('does not rewrite the app apex host root to the admin dashboard', () => {
    const proxySource = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8');
    const appHostBlock = proxySource.slice(
      proxySource.indexOf("hostWithoutPort === 'app.elevateforhumanity.org'"),
      proxySource.indexOf('// {subdomain}.app.elevateforhumanity.org'),
    );

    expect(appHostBlock).toContain("learnerUrl.pathname = '/learner/dashboard'");
    expect(appHostBlock).not.toContain("rewriteUrl.pathname = adminPath");
    expect(appHostBlock).not.toContain("'/admin/dashboard'");
  });

  it('guards against configuring app.elevateforhumanity.org as the admin host', () => {
    const proxySource = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8');
    expect(proxySource).toContain("canonicalAdminHost === 'app.elevateforhumanity.org'");
    expect(proxySource).toContain('Falling back to default admin host');
  });
});
