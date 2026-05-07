// Brand configuration for governance pages
export type Brand = 'elevate';

export interface BrandConfig {
  name: string;
  shortName: string;
  domain: string;
  canonicalDomain: string;
  primaryColor: string;
  accentColor: string;
}

export const brandConfigs: Record<Brand, BrandConfig> = {
  elevate: {
    name: 'Elevate for Humanity',
    shortName: 'Elevate',
    domain: 'www.elevateforhumanity.org',
    canonicalDomain: 'www.elevateforhumanity.org',
    primaryColor: 'blue',
    accentColor: 'slate',
  },};

// Supersonic domain constant for middleware matching
export function getCanonicalUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  return `${base}${path}`;
}

export function getBrandFromHost(host: string): Brand {
  return 'elevate';
}
