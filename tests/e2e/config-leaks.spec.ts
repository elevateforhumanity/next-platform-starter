import { test, expect } from '@playwright/test';

const PATHS = [
  '/',
  '/skilled-trades-training-indiana',
  '/programs/culinary-apprenticeship',
  '/programs',
  '/employers',
];

test.describe('PLATFORM_DEFAULTS must not leak in public HTML', () => {
  for (const path of PATHS) {
    test(`no raw placeholders on ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await page.waitForLoadState('domcontentloaded');
      const html = await page.content();
      expect(html).not.toContain('{PLATFORM_DEFAULTS.orgName}');
      expect(html).not.toContain('${PLATFORM_DEFAULTS.orgName}');
      expect(html).not.toContain('alt={PLATFORM_DEFAULTS.orgName}');
    });
  }
});
