#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'data', 'content'];
const IMAGE_REF_RE = /(?:src|posterImage|heroImage|image)\s*[:=]\s*["'`]([^"'`]+\.(?:png|jpg|jpeg|webp|gif|svg|avif))["'`]/g;
const PEXELS_RE = /\/images\/pexels\//;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const refs = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = IMAGE_REF_RE.exec(text)) !== null) {
    const ref = m[1];
    if (!ref.startsWith('/images/')) continue;
    const relFile = path.relative(ROOT, file);
    const abs = path.join(ROOT, 'public', ref);
    refs.push({ file: relFile, ref, exists: fs.existsSync(abs), pexels: PEXELS_RE.test(ref) });
  }
}

const unique = new Map();
for (const r of refs) unique.set(`${r.file}::${r.ref}`, r);
const rows = [...unique.values()];
const missing = rows.filter((r) => !r.exists);
const pexels = rows.filter((r) => r.pexels);

const report = {
  scannedFiles: files.length,
  imageRefs: rows.length,
  missingRefs: missing.length,
  pexelsRefs: pexels.length,
  missing,
  pexels,
};

const outDir = path.join(ROOT, 'docs', 'audits');
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, 'image-assets-audit.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const mdPath = path.join(outDir, 'IMAGE_ASSETS_AUDIT.md');
const md = `# Image Assets Audit\n\n- Scanned files: ${report.scannedFiles}\n- Image refs (/images/*): ${report.imageRefs}\n- Missing refs: ${report.missingRefs}\n- Legacy pexels refs: ${report.pexelsRefs}\n\n## Missing refs\n${missing.slice(0, 200).map((r)=>`- ${r.ref} in \`${r.file}\``).join('\n') || 'None'}\n\n## Legacy pexels refs\n${pexels.slice(0, 300).map((r)=>`- ${r.ref} in \`${r.file}\``).join('\n') || 'None'}\n`;
fs.writeFileSync(mdPath, md);

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
console.log(`Missing refs: ${missing.length}`);
console.log(`Pexels refs: ${pexels.length}`);
