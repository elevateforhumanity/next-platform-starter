#!/usr/bin/env node
/**
 * Audits hero-banners.json vs static programs and on-disk media.
 * Usage: node scripts/audit-hero-banner-coverage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const banners = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/hero-banners.json'), 'utf8'));

const indexSrc = fs.readFileSync(path.join(ROOT, 'data/programs/index.ts'), 'utf8');
const staticSlugs = [...indexSrc.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
const uniqueStatic = [...new Set(staticSlugs)];

const missingBanner = uniqueStatic.filter((s) => !banners[s]?.pageKey);
const badPoster = [];
const badVideo = [];

for (const [key, b] of Object.entries(banners)) {
  if (b.posterImage && !b.videoSrcDesktop) {
    const file = path.join(ROOT, 'public', b.posterImage.replace(/^\//, ''));
    if (!fs.existsSync(file)) badPoster.push({ key, poster: b.posterImage });
  }
  if (b.videoSrcDesktop) {
    const rel = b.videoSrcDesktop.replace(/^\//, '');
    const file = path.join(ROOT, 'public', rel);
    if (rel.startsWith('videos/') && !fs.existsSync(file) && !fs.existsSync(path.join(ROOT, 'public', rel))) {
      badVideo.push({ key, video: b.videoSrcDesktop });
    }
  }
}

const out = {
  staticProgramSlugs: uniqueStatic.length,
  heroBannerEntries: Object.keys(banners).length,
  staticMissingBanner: missingBanner,
  imageOnlyMissingFile: badPoster,
  videoMissingFile: badVideo,
};

const outDir = path.join(ROOT, 'docs/audits');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'HERO_BANNER_COVERAGE.json'), JSON.stringify(out, null, 2));

console.log('Static programs:', out.staticProgramSlugs);
console.log('Missing banner entry:', missingBanner.length, missingBanner.join(', ') || '(none)');
console.log('Broken poster files:', badPoster.length);
badPoster.slice(0, 10).forEach((r) => console.log(' ', r.key, r.poster));
console.log('Wrote docs/audits/HERO_BANNER_COVERAGE.json');

process.exit(missingBanner.length || badPoster.length ? 1 : 0);
