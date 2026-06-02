/**
 * Known broken / legacy public image paths → verified files under /public.
 * Use resolveSiteImagePath() before passing src to next/image.
 */
const SITE_IMAGE_ALIASES: Record<string, string> = {
  '/images/pages/tax-preparation.webp': '/images/business/office-admin.webp',
  '/images/pages/tax-preparation.jpg': '/images/business/professional-2.jpg',
  '/images/pages/accessibility-hero.webp': '/images/pages/accessibility-hero.jpg',
  '/images/pages/esthetician.webp': '/images/beauty/esthetician.webp',
};

export function resolveSiteImagePath(src: string): string {
  return SITE_IMAGE_ALIASES[src] ?? src;
}
