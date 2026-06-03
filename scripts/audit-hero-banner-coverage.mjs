#!/usr/bin/env node
/**
 * Audits hero-banners.json vs static programs and on-disk media.
 * Usage: node scripts/audit-hero-banner-coverage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const banners = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/hero-banners.json'), 'utf8'));

// Slugs registered in data/programs/index.ts (not every slug: line in program files)
const indexSrc = fs.readFileSync(path.join(ROOT, 'data/programs/index.ts'), 'utf8');
const importedFiles = [...indexSrc.matchAll(/from '\.\/([^']+)'/g)].map((m) => m[1]);
const uniqueStatic = [];
for (const file of importedFiles) {
  const src = fs.readFileSync(path.join(ROOT, 'data/programs', `${file}.ts`), 'utf8');
  const m = src.match(/slug:\s*['"]([^'"]+)['"]/);
  if (m) uniqueStatic.push(m[1]);
}

const missingBanner = uniqueStatic.filter((s) => !banners[s]?.pageKey);
const missingVideo = [];
const hasPoster = [];

for (const [key, b] of Object.entries(banners)) {
  if (!b.videoSrcDesktop) missingVideo.push(key);
  if (b.posterImage) hasPoster.push(key);
}

const out = {
  staticProgramSlugs: uniqueStatic.length,
  heroBannerEntries: Object.keys(banners).length,
  staticMissingBanner: missingBanner,
  bannersMissingVideo: missingVideo,
  bannersWithPosterImage: hasPoster,
};

const outDir = path.join(ROOT, 'docs/audits');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'HERO_BANNER_COVERAGE.json'), JSON.stringify(out, null, 2));

console.log('Static programs:', out.staticProgramSlugs);
console.log('Missing banner entry:', missingBanner.length, missingBanner.join(', ') || '(none)');
console.log('Banners missing video:', missingVideo.length);
console.log('Banners with posterImage (should be 0):', hasPoster.length);
console.log('Wrote docs/audits/HERO_BANNER_COVERAGE.json');

process.exit(missingBanner.length || missingVideo.length || hasPoster.length ? 1 : 0);
