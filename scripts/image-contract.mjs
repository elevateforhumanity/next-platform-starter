#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

const args = new Set(process.argv.slice(2));
const FIX_MODE = args.has('--fix');
const STRICT_MODE = args.has('--strict');
const JSON_MODE = args.has('--json');
const QUIET = args.has('--quiet');
const IS_MAIN = process.env.GITHUB_REF_NAME === 'main' || process.env.GITHUB_REF === 'refs/heads/main';

const findings = [];
const fixes = [];

function addFinding(severity, code, file, line, message) {
  findings.push({ severity, code, file, line, message });
}

function walk(dir, exts = new Set(['.ts', '.tsx', '.js', '.jsx'])) {
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

function isMarketingProgramHero(relPath, content) {
  return /components\/marketing\//.test(relPath) || /\/programs\//.test(relPath) || /hero/i.test(relPath) || /Hero/.test(content);
}

function checkRawImg(content, relPath) {
  const rawImgRe = /<img\b[\s\S]*?>/g;
  for (const m of content.matchAll(rawImgRe)) {
    // Skip <img> inside JSDoc/block comments (* ... *)
    const pre = content.slice(Math.max(0, m.index - 400), m.index);
    const lineText = content.split('\n')[lineNumber(content, m.index) - 1] ?? '';
    if (/^\s*\*/.test(lineText)) continue; // inside JSDoc block comment
    if (/\/\*[\s\S]*$/.test(pre) && !/\*\//.test(pre.slice(pre.lastIndexOf('/*')))) continue; // inside block comment
    if (!/IMAGE-CONTRACT:\s*allow raw img because/i.test(pre)) {
      addFinding('STRICT', 'RAW_IMG_DISALLOWED', relPath, lineNumber(content, m.index), 'Raw <img> found without IMAGE-CONTRACT allow comment');
    }
  }
}

function getNextImageComponentNames(content) {
  const names = new Set();
  const defaultImportRe = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]next\/image['"]/g;
  for (const m of content.matchAll(defaultImportRe)) {
    names.add(m[1]);
  }
  return names;
}

function parseImageBlocks(content, componentNames) {
  if (!componentNames.size) return [];
  const blocks = [];
  for (const name of componentNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match from <Image to the self-closing /> — skip > inside quoted attribute values
    // Strategy: find <Image, then scan forward to find the matching />
    const startRe = new RegExp(`<${escaped}\\b`, 'g');
    for (const m of content.matchAll(startRe)) {
      let i = m.index + m[0].length;
      let inStr = null;
      let depth = 0;
      while (i < content.length) {
        const ch = content[i];
        if (inStr) {
          if (ch === inStr && content[i - 1] !== '\\') inStr = null;
        } else if (ch === '"' || ch === "'") {
          inStr = ch;
        } else if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
        } else if (depth === 0 && ch === '/' && content[i + 1] === '>') {
          // self-closing />
          blocks.push({ text: content.slice(m.index, i + 2), index: m.index });
          break;
        } else if (depth === 0 && ch === '>' && content[i - 1] !== '=') {
          // opening > (non-self-closing) — treat as end of opening tag
          blocks.push({ text: content.slice(m.index, i + 1), index: m.index });
          break;
        }
        i++;
      }
    }
  }
  blocks.sort((a, b) => a.index - b.index);
  return blocks;
}

function maybeFixSizes(block, relPath, original) {
  if (block.includes('sizes=')) return block;
  const heroLike = /w-full|h-\[|object-cover|fill\b/.test(block) || /hero|marketing|program/i.test(relPath);
  if (!FIX_MODE || !heroLike) return block;
  const fixed = block.replace('<Image', '<Image sizes="100vw"');
  if (fixed !== block) {
    fixes.push({ file: relPath, action: 'add sizes="100vw"' });
    return fixed;
  }
  return block;
}

function scanFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  let content = fs.readFileSync(absPath, 'utf8');
  const nextImageNames = getNextImageComponentNames(content);

  checkRawImg(content, rel);

  const blocks = parseImageBlocks(content, nextImageNames);
  if (!blocks.length) return;

  let changed = false;
  for (const b of blocks) {
    let block = b.text;
    const line = lineNumber(content, b.index);

    if (!/\balt=/.test(block)) {
      addFinding('CRITICAL', 'IMAGE_ALT_MISSING', rel, line, 'next/image missing alt text');
    }

    if (!/\bsizes=/.test(block)) {
      addFinding('STRICT', 'IMAGE_SIZES_MISSING', rel, line, 'next/image missing sizes attribute');
      const fixed = maybeFixSizes(block, rel, content);
      if (fixed !== block) {
        content = content.replace(block, fixed);
        block = fixed;
        changed = true;
      }
    }

    if (!(/\bwidth=/.test(block) && /\bheight=/.test(block)) && !/\bfill\b/.test(block)) {
      addFinding('STRICT', 'IMAGE_DIMENSIONS_MISSING', rel, line, 'next/image requires width/height or fill');
    }

    if (isMarketingProgramHero(rel, content)) {
      const hasFallback = /\bplaceholder=|\bblurDataURL=|fallback|posterImage/.test(block);
      if (!hasFallback) {
        addFinding('STRICT', 'IMAGE_PLACEHOLDER_MISSING', rel, line, 'Marketing/program/hero image missing placeholder or approved fallback');
        if (FIX_MODE && !/IMAGE-CONTRACT:\s*placeholder-review/.test(content)) {
          const marker = '// IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback)';
          const lines = content.split('\n');
          lines.splice(line - 1, 0, marker);
          content = lines.join('\n');
          changed = true;
          fixes.push({ file: rel, action: 'add placeholder-review comment' });
        }
      }
    }
  }

  if (changed) fs.writeFileSync(absPath, content);
}

function summarize() {
  const counts = { CRITICAL: 0, STRICT: 0, REPORT: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  const topFilesMap = new Map();
  for (const f of findings) topFilesMap.set(f.file, (topFilesMap.get(f.file) || 0) + 1);
  const topFiles = [...topFilesMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([file, count]) => ({ file, count }));
  return { counts, topFiles };
}

function writeReport(report) {
  if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });
  const out = path.join(ARTIFACTS, 'image-contract-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  return out;
}

function main() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  for (const file of files) scanFile(file);

  const summary = summarize();
  const report = {
    tool: 'image-contract',
    timestamp: new Date().toISOString(),
    fixMode: FIX_MODE,
    strictMode: STRICT_MODE,
    isMainBranch: IS_MAIN,
    counts: summary.counts,
    topFiles: summary.topFiles,
    fixes,
    findings,
  };
  const out = writeReport(report);

  if (JSON_MODE) {
    console.log(JSON.stringify(report));
  } else if (!QUIET) {
    console.log('\nImage Contract Summary');
    console.log(`CRITICAL: ${summary.counts.CRITICAL}  STRICT: ${summary.counts.STRICT}  REPORT: ${summary.counts.REPORT}`);
    if (fixes.length) console.log(`Auto-fixes applied: ${fixes.length}`);
    console.log(`Report: ${path.relative(ROOT, out)}`);
  }

  const shouldBlockStrict = STRICT_MODE || IS_MAIN;
  const shouldFail = summary.counts.CRITICAL > 0 || (shouldBlockStrict && summary.counts.STRICT > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();
