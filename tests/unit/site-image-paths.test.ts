import { describe, expect, it } from 'vitest';
import { resolveSiteImagePath } from '@/lib/images/site-image-paths';

describe('resolveSiteImagePath', () => {
  it('maps known broken webp paths to existing files', () => {
    expect(resolveSiteImagePath('/images/pages/tax-preparation.webp')).toBe(
      '/images/business/office-admin.webp',
    );
    expect(resolveSiteImagePath('/images/pages/accessibility-hero.webp')).toBe(
      '/images/pages/accessibility-hero.jpg',
    );
    expect(resolveSiteImagePath('/images/pages/esthetician.webp')).toBe(
      '/images/beauty/esthetician.webp',
    );
  });

  it('returns unknown paths unchanged', () => {
    expect(resolveSiteImagePath('/images/pages/hvac-technician.webp')).toBe(
      '/images/pages/hvac-technician.webp',
    );
  });
});
