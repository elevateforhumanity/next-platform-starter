#!/usr/bin/env node
/**
 * Full-site visual audit: oversized heroes/images, layout/text gaps.
 *
 * Usage: node scripts/audit-visual-layout.mjs
 * Writes: docs/audits/VISUAL_LAYOUT_AUDIT.json + VISUAL_LAYOUT_AUDIT.md
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'content'];
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__']);

/** Canonical max hero height per docs/page-design-standard.md */
const CANONICAL_MAX_HERO_PX = 560;
const CANONICAL_HERO_CLASS =
  'h-[38vh] min-h-[220px] max-h-[420px]';

const OVERSIZED_HERO_PATTERNS = [
  {
    id: 'vh-50-plus',
    re: /h-\[(5[0-9]|[6-9][0-9]|100)vh\]/g,
    severity: 'high',
    message: 'Hero/viewport height ≥50vh (often oversized)',
  },
  {
    id: 'min-h-420-plus',
    re: /min-h-\[(?:4[2-9]\d|[5-9]\d{2,})px\]/g,
    severity: 'high',
    message: 'min-height ≥420px on hero-like container',
  },
  {
    id: 'max-h-600-plus',
    re: /max-h-\[(6[0-9]{2}|[7-9]\d{2}|[8-9]\d{2})px\]/g,
    severity: 'high',
    message: 'max-height >560px (exceeds design standard)',
  },
  {
    id: 'clamp-tall',
    re: /clamp\(\s*(3[2-9]{2}|[4-9]\d{2})px\s*,/g,
    severity: 'medium',
    message: 'clamp() minimum ≥320px (tall hero)',
  },
  {
    id: 'clamp-max-600-plus',
    re: /clamp\([^)]+,\s*[^)]+,\s*(6[0-9]{2}|[7-9]\d{2})px\s*\)/g,
    severity: 'high',
    message: 'clamp() max >560px',
  },
  {
    id: 'page-video-hero-primary',
    re: /primary:\s*['"]h-\[75vh\]/g,
    severity: 'critical',
    message: 'PageVideoHero primary size is 75vh (legacy oversized)',
  },
  {
    id: 'home-top-hero-500',
    re: /lg:h-\[500px\]/g,
    severity: 'medium',
    message: 'HomeTopHero lg height 500px without max-h cap',
  },
  {
    id: 'layout-700',
    re: /h-\[700px\]/g,
    severity: 'critical',
    message: 'Fixed 700px hero section',
  },
];

const IMAGE_PERF_PATTERNS = [
  {
    id: 'sizes-100vw',
    re: /\bsizes=["']100vw["']/g,
    severity: 'medium',
    message: 'sizes=100vw loads full viewport width image (heavy LCP)',
  },
  {
    id: 'preload-full-hero',
    re: /preloadFull\b/g,
    severity: 'high',
    message: 'preloadFull downloads entire hero video on load',
  },
  {
    id: 'fill-no-sizes',
    re: /<Image[^>]*\bfill\b(?![^>]*\bsizes=)/g,
    severity: 'low',
    message: 'next/image fill without sizes (may over-fetch)',
  },
];

const LAYOUT_TEXT_PATTERNS = [
  {
    id: 'text-gray',
    re: /\btext-gray-\d+/g,
    severity: 'medium',
    message: 'Use text-slate-* per page design standard',
  },
  {
    id: 'hero-gradient-overlay',
    re: /(?:hero|Hero)[\s\S]{0,400}bg-gradient-to/g,
    severity: 'high',
    message: 'Gradient overlay near hero (forbidden on hero frame)',
  },
  {
    id: 'hero-text-overlay',
    re: /absolute inset-0[\s\S]{0,300}text-(?:white|3xl|4xl|5xl)/g,
    severity: 'high',
    message: 'Headline/text overlaid on hero media',
  },
  {
    id: 'invisible-white-on-white',
    re: /bg-white[^"']*["'][^"']*text-white/g,
    severity: 'high',
    message: 'Possible white text on white background',
  },
  {
    id: 'sparse-hero-only',
    re: /<section[^>]*hero[\s\S]{0,200}<\/section>\s*<section[^>]*(?:cta|CTA)/gi,
    severity: 'low',
    message: 'Possible sparse page (hero then CTA with little content)',
  },
  {
    id: 'empty-alt',
    re: /<Image[^>]*alt=["']\s*["']/g,
    severity: 'medium',
    message: 'Empty image alt text',
  },
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(tsx|jsx)$/.test(ent.name)) out.push(full);
  }
  return out;
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function findMatches(content, relFile, patterns) {
  const hits = [];
  for (const pat of patterns) {
    pat.re.lastIndex = 0;
    let m;
    while ((m = pat.re.exec(content)) !== null) {
      hits.push({
        file: relFile,
        line: lineNumber(content, m.index),
        match: m[0].slice(0, 80),
        ...pat,
      });
    }
  }
  return hits;
}

function usesCanonicalHero(content) {
  return (
    content.includes(CANONICAL_HERO_CLASS) ||
    content.includes('hero.imageWrap') ||
    content.includes('heroTokens.imageWrap') ||
    content.includes('HeroPicture') ||
    content.includes('HeroVideo')
  );
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const oversizedHero = [];
const imagePerf = [];
const layoutText = [];
const marketingPagesNoCanonical = [];

for (const full of files) {
  const rel = path.relative(ROOT, full);
  const content = fs.readFileSync(full, 'utf8');
  oversizedHero.push(...findMatches(content, rel, OVERSIZED_HERO_PATTERNS));
  imagePerf.push(...findMatches(content, rel, IMAGE_PERF_PATTERNS));

  if (rel.startsWith('app/') && rel.endsWith('page.tsx')) {
    const isPublic =
      !rel.includes('/admin/') &&
      !rel.includes('/api/') &&
      !rel.includes('(app)/') &&
      !rel.includes('/lms/');
    if (isPublic && /(?:Hero|hero|fill\s)/.test(content) && !usesCanonicalHero(content)) {
      marketingPagesNoCanonical.push(rel);
    }
  }

  layoutText.push(...findMatches(content, rel, LAYOUT_TEXT_PATTERNS));
}

function groupByFile(hits) {
  const map = new Map();
  for (const h of hits) {
    if (!map.has(h.file)) map.set(h.file, []);
    map.get(h.file).push(h);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

function countBySeverity(hits) {
  const c = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const h of hits) {
    c[h.severity] = (c[h.severity] || 0) + 1;
  }
  return c;
}

const report = {
  scannedFiles: files.length,
  generatedAt: new Date().toISOString(),
  canonicalHero: CANONICAL_HERO_CLASS,
  summary: {
    oversizedHero: countBySeverity(oversizedHero),
    imagePerf: countBySeverity(imagePerf),
    layoutText: countBySeverity(layoutText),
    oversizedHeroTotal: oversizedHero.length,
    imagePerfTotal: imagePerf.length,
    layoutTextTotal: layoutText.length,
    marketingPagesWithHeroButNotCanonical: marketingPagesNoCanonical.length,
  },
  topOversizedHeroFiles: groupByFile(oversizedHero).slice(0, 40),
  topImagePerfFiles: groupByFile(imagePerf).slice(0, 30),
  topLayoutTextFiles: groupByFile(layoutText).slice(0, 40),
  marketingPagesNoCanonical: marketingPagesNoCanonical.slice(0, 80),
  criticalHits: [...oversizedHero, ...imagePerf, ...layoutText].filter(
    (h) => h.severity === 'critical',
  ),
};

const outDir = path.join(ROOT, 'docs', 'audits');
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, 'VISUAL_LAYOUT_AUDIT.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

function mdSection(title, groups, limit = 25) {
  let s = `## ${title}\n\n`;
  if (!groups.length) return s + '_None_\n\n';
  for (const [file, hits] of groups.slice(0, limit)) {
    s += `### \`${file}\` (${hits.length})\n`;
    for (const h of hits.slice(0, 8)) {
      s += `- L${h.line} **${h.id}**: ${h.message} — \`${h.match}\`\n`;
    }
    if (hits.length > 8) s += `- _+${hits.length - 8} more_\n`;
    s += '\n';
  }
  return s;
}

const md = `# Visual layout audit (heroes, images, text gaps)

Generated: ${report.generatedAt}

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Oversized heroes | ${report.summary.oversizedHero.critical} | ${report.summary.oversizedHero.high} | ${report.summary.oversizedHero.medium} | ${report.summary.oversizedHero.low} | ${report.summary.oversizedHeroTotal} |
| Image load cost | ${report.summary.imagePerf.critical} | ${report.summary.imagePerf.high} | ${report.summary.imagePerf.medium} | ${report.summary.imagePerf.low} | ${report.summary.imagePerfTotal} |
| Layout / text | ${report.summary.layoutText.critical} | ${report.summary.layoutText.high} | ${report.summary.layoutText.medium} | ${report.summary.layoutText.low} | ${report.summary.layoutTextTotal} |

**Canonical hero (design standard):** \`${CANONICAL_HERO_CLASS}\` or \`HeroPicture\` / \`HeroVideo\` from \`components/marketing/\`.

**Marketing pages with hero markup but not canonical components:** ${report.summary.marketingPagesWithHeroButNotCanonical}

### Critical findings

${
  report.criticalHits.length
    ? report.criticalHits
        .map((h) => `- \`${h.file}:${h.line}\` ${h.message}`)
        .join('\n')
    : '_None_'
}

${mdSection('Oversized hero / banner patterns', report.topOversizedHeroFiles, 30)}
${mdSection('Image performance (LCP / video)', report.topImagePerfFiles, 20)}
${mdSection('Layout & text standard violations', report.topLayoutTextFiles, 25)}

## Recommended fix order

1. **Shared components** — \`HeroVideo.tsx\`, \`HeroPicture.tsx\`, \`page-design-tokens.ts\` \`hero.imageWrap\`, \`PageVideoHero.tsx\` SIZE map, \`PublicLandingPage.tsx\`, \`HomeTopHero.tsx\`
2. **Remove \`preloadFull\`** on marketing heroes (use \`metadata\` preload; home page only may opt in)
3. **Replace \`sizes="100vw"\`** with \`(max-width: 768px) 100vw, 1200px\` on heroes
4. **Page-by-page** — host-shops, government, store, pathways templates using \`h-[60vh] min-h-[450px]\`
5. **text-gray-* → text-slate-*** in touched files

Re-run: \`node scripts/audit-visual-layout.mjs\` and \`node scripts/audit-image-assets.mjs\`
`;

const mdPath = path.join(outDir, 'VISUAL_LAYOUT_AUDIT.md');
fs.writeFileSync(mdPath, md);

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
console.log(
  `Oversized: ${report.summary.oversizedHeroTotal} | Image perf: ${report.summary.imagePerfTotal} | Layout/text: ${report.summary.layoutTextTotal}`,
);
console.log(`Critical: ${report.criticalHits.length}`);
