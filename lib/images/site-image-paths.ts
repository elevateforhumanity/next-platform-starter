/**
 * Known broken / legacy public image paths → verified files under /public.
 * Use resolveSiteImagePath() before passing src to next/image.
 */
import conversionManifest from '../../scripts/.image-conversion-manifest.json' with { type: 'json' };

const SITE_IMAGE_ALIASES: Record<string, string> = {
  '/images/pages/tax-preparation.webp': '/images/business/office-admin.webp',
  '/images/pages/tax-preparation.jpg': '/images/business/professional-2.jpg',
  '/images/pages/accessibility-hero.webp': '/images/pages/accessibility-hero.jpg',
  '/images/pages/esthetician.webp': '/images/beauty/esthetician.webp',
  '/images/programs/culinary.jpg': '/images/pages/culinary.webp',
  '/hero-images/how-it-works-hero.jpg': '/hero-images/how-it-works-hero.webp',
  '/images/pages/how-it-works-hero.jpg': '/images/pages/how-it-works-hero.webp',
  '/images/alberta-davis.jpg': '/images/alberta-davis.webp',
  '/images/facilities-new/facility-2.jpg': '/images/facilities-new/facility-1.webp',
  // Broken JPG references → existing WebP versions
  '/images/programs-hq/cdl-trucking.jpg': '/images/programs-hq/cdl-trucking.webp',
  '/images/pages/admin-compliance-hero.jpg': '/images/pages/admin-compliance-hero.webp',
  '/images/demos/lms-overview-thumb.jpg': '/images/demos/lms-overview-thumb.webp',
  '/images/pages/barber-gallery-3.jpg': '/images/pages/barber-gallery-3.webp',
  '/images/pages/career-counseling-page-1.jpg': '/images/pages/career-counseling-page-1.webp',
  '/images/pages/urban-build-crew-page-1.jpg': '/images/pages/urban-build-crew-page-1.webp',
};

/** JPG paths retired after WebP migration — map to existing .webp siblings. */
const MANIFEST_JPG_TO_WEBP: Record<string, string> = Object.fromEntries(
  (conversionManifest as Array<{ origRel: string; webpRel: string }>).map((row) => [
    row.origRel,
    row.webpRel,
  ]),
);

const DEFAULT_FALLBACK = '/images/pages/prog-hero-main-2.webp';

export function resolveSiteImagePath(src: string | null | undefined): string {
  if (!src || !src.trim()) return DEFAULT_FALLBACK;
  const trimmed = src.trim();
  return (
    SITE_IMAGE_ALIASES[trimmed] ??
    MANIFEST_JPG_TO_WEBP[trimmed] ??
    trimmed
  );
}
