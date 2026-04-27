#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

const args = new Set(process.argv.slice(2));
const STRICT_MODE = args.has('--strict');
const JSON_MODE = args.has('--json');
const QUIET = args.has('--quiet');
const IS_MAIN = process.env.GITHUB_REF_NAME === 'main' || process.env.GITHUB_REF === 'refs/heads/main';

const findings = [];

function addFinding(severity, code, file, line, message) {
  findings.push({ severity, code, file, line, message });
}

function walk(dir, exts = new Set(['.tsx', '.jsx'])) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function scanFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  const content = fs.readFileSync(absPath, 'utf8');

  // 1) no custom program cards when shared ProgramCard exists
  if (/components\/programs\//.test(rel) === false && /function\s+\w*Program\w*Card|const\s+\w*Program\w*Card\s*=/.test(content)) {
    const idx = content.search(/function\s+\w*Program\w*Card|const\s+\w*Program\w*Card\s*=/);
    addFinding('STRICT', 'CUSTOM_PROGRAM_CARD', rel, lineNumber(content, idx), 'Custom program card detected. Use shared components/programs/ProgramCard.tsx');
  }

  // 2) non-brand green tokens
  const greenRe = /\b(?:bg|text|border)-green-\d+\b/g;
  for (const m of content.matchAll(greenRe)) {
    addFinding('STRICT', 'NON_BRAND_GREEN', rel, lineNumber(content, m.index), `Use brand-green-* token instead of ${m[0]}`);
  }

  // 3) CheckCircle2 bullet prohibition
  const checkCircleRe = /<CheckCircle2\b/g;
  for (const m of content.matchAll(checkCircleRe)) {
    addFinding('STRICT', 'PROHIBITED_CHECKCIRCLE2', rel, lineNumber(content, m.index), 'CheckCircle2 used. Replace with brand dot bullet.');
  }

  // 4) Decorative GraduationCap/Award unless intentional accessibility marker present
  const decoRe = /<(GraduationCap|Award)\b/g;
  for (const m of content.matchAll(decoRe)) {
    const start = Math.max(0, m.index - 160);
    const end = Math.min(content.length, m.index + 240);
    const window = content.slice(start, end);
    if (!/aria-label=|title=|INTENTIONAL_ICON/.test(window)) {
      addFinding('STRICT', 'PROHIBITED_DECORATIVE_ICON', rel, lineNumber(content, m.index), `${m[1]} appears decorative without accessibility intent marker`);
    }
  }

  // 5) weak CTA copy
  const weakCtas = [/\bLearn More\b/g, /\bClick Here\b/g, /\bSubmit\b/g, /\bExplore\b/g];
  for (const re of weakCtas) {
    for (const m of content.matchAll(re)) {
      addFinding('STRICT', 'WEAK_CTA_COPY', rel, lineNumber(content, m.index), `Weak CTA copy found: "${m[0]}"`);
    }
  }

  // 6) dead href="#"
  const deadHrefRe = /href=["']#["']/g;
  for (const m of content.matchAll(deadHrefRe)) {
    addFinding('STRICT', 'DEAD_HREF', rel, lineNumber(content, m.index), 'Dead CTA/link href="#" detected');
  }

  // 7) solid bg-white with text-white on same element
  const classRe = /className=["'`][^"'`]*["'`]/g;
  for (const m of content.matchAll(classRe)) {
    if (/\bbg-white\b/.test(m[0]) && /\btext-white\b/.test(m[0])) {
      addFinding('STRICT', 'INVISIBLE_TEXT', rel, lineNumber(content, m.index), 'className contains bg-white and text-white on the same element');
    }
  }

  // 8) hero image/video without approved treatment
  if (/hero/i.test(rel) || /Hero/.test(content)) {
    if (/<video\b/.test(content) && !/useHeroVideo|HeroVideo/.test(content)) {
      const idx = content.search(/<video\b/);
      addFinding('STRICT', 'HERO_VIDEO_TREATMENT', rel, lineNumber(content, idx), 'Hero video should use approved HeroVideo/useHeroVideo treatment');
    }
    if (/<Image\b|<img\b/.test(content) && /bg-gradient-to-|from-black\//.test(content)) {
      const idx = content.search(/bg-gradient-to-|from-black\//);
      addFinding('STRICT', 'HERO_OVERLAY_TREATMENT', rel, lineNumber(content, idx), 'Hero media uses prohibited gradient/dark overlay treatment');
    }
  }

  // 9) inconsistent max-width/container patterns
  const maxWRe = /\bmax-w-\[[^\]]+\]|\bmax-w-(8xl|9xl|10xl)\b/g;
  for (const m of content.matchAll(maxWRe)) {
    addFinding('STRICT', 'INCONSISTENT_CONTAINER', rel, lineNumber(content, m.index), `Non-standard max-width pattern ${m[0]} detected`);
  }

  // REPORT-only opportunities
  const reportPatterns = [
    { re: /\btext-gray-\d+\b/g, code: 'REPORT_TYPOGRAPHY', msg: 'Use text-slate-* tokens for typography consistency' },
    { re: /\bspace-y-\[\d+px\]/g, code: 'REPORT_SPACING', msg: 'Custom spacing token detected; prefer design tokens' },
  ];
  for (const p of reportPatterns) {
    for (const m of content.matchAll(p.re)) {
      addFinding('REPORT', p.code, rel, lineNumber(content, m.index), p.msg);
    }
  }
}

function summarize() {
  const counts = { CRITICAL: 0, STRICT: 0, REPORT: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  const topFilesMap = new Map();
  for (const f of findings) topFilesMap.set(f.file, (topFilesMap.get(f.file) || 0) + 1);
  const topFiles = [...topFilesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, count]) => ({ file, count }));
  return { counts, topFiles };
}

function writeReport(report) {
  if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });
  const out = path.join(ARTIFACTS, 'design-enforcer-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return out;
}

function main() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  for (const file of files) scanFile(file);

  const summary = summarize();
  const report = {
    tool: 'design-enforcer',
    timestamp: new Date().toISOString(),
    strictMode: STRICT_MODE,
    isMainBranch: IS_MAIN,
    counts: summary.counts,
    topFiles: summary.topFiles,
    findings,
  };
  const out = writeReport(report);

  if (JSON_MODE) {
    console.log(JSON.stringify(report));
  } else if (!QUIET) {
    console.log('\nDesign Enforcer Summary');
    console.log(`CRITICAL: ${summary.counts.CRITICAL}  STRICT: ${summary.counts.STRICT}  REPORT: ${summary.counts.REPORT}`);
    if (summary.topFiles.length) {
      console.log('Top files needing attention:');
      for (const t of summary.topFiles) console.log(` - ${t.file} (${t.count})`);
    }
    console.log(`Report: ${path.relative(ROOT, out)}`);
  }

  const shouldBlockStrict = STRICT_MODE || IS_MAIN;
  const shouldFail = summary.counts.CRITICAL > 0 || (shouldBlockStrict && summary.counts.STRICT > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();
