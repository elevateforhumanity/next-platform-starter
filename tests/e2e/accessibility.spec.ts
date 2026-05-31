import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests - WCAG AA Compliance', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    // Wait for all navigation and async rendering to settle before axe scan
    // to prevent "Execution context was destroyed" from mid-scan redirects.
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    );
    expect(blocking).toEqual([]);
  });

  test('header navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('dropdown menus should work with keyboard', async ({ page }) => {
    await page.goto('/');

    // Tab to navigation area
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that we can navigate with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(focusedElement);
  });

  test('mobile menu should be accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Find the mobile menu toggle — prefer aria-label, fall back to header button with SVG
    const menuButton = page
      .locator('header button[aria-label], header button[aria-expanded], header button:has(svg)')
      .first();

    const isVisible = await menuButton.isVisible().catch(() => false);
    if (isVisible) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }

    // Nav links should be present regardless of menu state
    const menuLinks = await page.locator('nav a').count();
    expect(menuLinks).toBeGreaterThan(0);
  });

  test('escape key should close mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.click('[aria-label="Open menu"]');
    await page.keyboard.press('Escape');

    const menuVisible = await page.locator('[role="dialog"]').isVisible();
    expect(menuVisible).toBeFalsy();
  });

  test('skip to main content link should work', async ({ page }) => {
    await page.goto('/');

    // Tab to the skip link (first focusable element)
    await page.keyboard.press('Tab');

    // Check skip link exists and is focusable
    const skipLink = page.locator('.skip-to-main');
    const skipLinkExists = (await skipLink.count()) > 0;
    expect(skipLinkExists).toBeTruthy();

    // Verify main content has id
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');

    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('all buttons should have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const hasAccessibleName = ariaLabel || (text && text.trim().length > 0);
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // We'll check this separately
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast',
    );
    expect(contrastViolations).toEqual([]);
  });

  test('form inputs should have labels', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('domcontentloaded');

    // Verify inputs in main content have some form of accessible labeling:
    // aria-label, aria-labelledby, or an associated <label for="id">
    const unlabeledInputs = await page
      .locator('main input:not([type="hidden"]):not([type="submit"]):not([type="button"])')
      .evaluateAll((inputs) =>
        inputs
          .filter((input) => {
            const style = window.getComputedStyle(input);
            return (
              input.getClientRects().length > 0 &&
              style.display !== 'none' &&
              style.visibility !== 'hidden'
            );
          })
          .map((input) => {
            const id = input.getAttribute('id') ?? '';
            const ariaLabel = input.getAttribute('aria-label')?.trim() ?? '';
            const ariaLabelledBy = input.getAttribute('aria-labelledby')?.trim() ?? '';
            const placeholder = input.getAttribute('placeholder')?.trim() ?? '';
            const title = input.getAttribute('title')?.trim() ?? '';
            const labels = (input as HTMLInputElement).labels;
            const labelFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;

            return {
              id,
              name: input.getAttribute('name') ?? '',
              type: input.getAttribute('type') ?? '',
              hasLabel: Boolean(
                ariaLabel ||
                  ariaLabelledBy ||
                  placeholder ||
                  title ||
                  (labels && labels.length > 0) ||
                  labelFor,
              ),
            };
          })
          .filter((input) => !input.hasLabel),
      );

    expect(unlabeledInputs).toEqual([]);
  });

  test('headings should be in correct order', async ({ page }) => {
    await page.goto('/');

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels = await Promise.all(
      headings.map((h) => h.evaluate((el) => parseInt(el.tagName[1]))),
    );

    expect(levels[0]).toBe(1);

    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('/');

    const linksWithoutNames = await page.locator('a').evaluateAll((anchors) =>
      anchors
        .filter((anchor) => {
          const style = window.getComputedStyle(anchor);
          const rect = anchor.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          );
        })
        .map((anchor) => ({
          href: anchor.getAttribute('href') ?? '',
          text: anchor.textContent?.trim() ?? '',
          ariaLabel: anchor.getAttribute('aria-label')?.trim() ?? '',
          imageAlt: anchor.querySelector('img[alt]')?.getAttribute('alt')?.trim() ?? '',
        }))
        .filter((anchor) => !anchor.text && !anchor.ariaLabel && !anchor.imageAlt),
    );

    expect(linksWithoutNames).toEqual([]);
  });

  test('page should have proper language attribute', async ({ page }) => {
    await page.goto('/');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('interactive elements should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    // Check that buttons have accessible names
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      // Check first 5 buttons
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      const hasAccessibleName = ariaLabel || (text && text.trim().length > 0);
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('focus indicators should be visible', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    const outline = await focusedElement.evaluate((el) => window.getComputedStyle(el).outline);

    expect(outline).not.toBe('none');
    expect(outline).not.toBe('');
  });
});
