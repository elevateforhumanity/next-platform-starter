/**
 * Ensures every hero-banners.json entry has videoSrcDesktop and strips posterImage.
 * Run: node scripts/patch-hero-banners-video-only.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const R2 = 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos';
const V = {
  home: `${R2}/hero-home-fast.mp4`,
  programs: `${R2}/programs-overview-video-with-narration.mp4`,
  barber: `${R2}/barber-hero-final.mp4`,
  cna: `${R2}/cna-hero.mp4`,
  hvac: `${R2}/hvac-hero-final.mp4`,
  it: `${R2}/it-technology.mp4`,
  student: `${R2}/student-portal-hero.mp4`,
  career: `${R2}/career-services-hero.mp4`,
  store: `${R2}/store-marketplace.mp4`,
};

/** Contextual default when a page has no dedicated hero video asset yet. */
const KEY_VIDEO = {
  'cosmetology-apprenticeship': V.barber,
  'nail-technician-apprenticeship': V.barber,
  'building-services-technician': V.hvac,
  electrical: V.hvac,
  'cna-waitlist': V.cna,
  'career-services': V.career,
  careers: V.career,
  'micro-programs': V.programs,
  training: V.programs,
  pathways: V.programs,
  services: V.programs,
  start: V.programs,
  credentials: V.programs,
  certifications: V.programs,
  'student-support': V.student,
  'for-students': V.student,
  'funding-how-it-works': V.programs,
  funding: V.programs,
  'federal-funded': V.programs,
  'financial-aid': V.programs,
  jri: V.programs,
  pricing: V.store,
  'apprenticeship-sponsor': V.programs,
  platform: V.it,
};

const file = path.join(process.cwd(), 'public/data/hero-banners.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let addedVideo = 0;
let removedPoster = 0;

for (const [key, banner] of Object.entries(data)) {
  if (banner.posterImage) {
    delete banner.posterImage;
    removedPoster++;
  }
  if (!banner.videoSrcDesktop) {
    banner.videoSrcDesktop = KEY_VIDEO[key] ?? V.home;
    addedVideo++;
  }
  if (!banner.videoSrcMobile) {
    banner.videoSrcMobile = banner.videoSrcDesktop;
  }
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Patched ${Object.keys(data).length} banners: +${addedVideo} videos, removed poster from ${removedPoster} entries`);

const stillNoVideo = Object.entries(data).filter(([, v]) => !v.videoSrcDesktop);
const stillPoster = Object.entries(data).filter(([, v]) => v.posterImage);
console.log('remaining without video:', stillNoVideo.length);
console.log('remaining with poster:', stillPoster.length);
