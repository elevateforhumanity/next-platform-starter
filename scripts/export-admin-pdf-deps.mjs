/**
 * Copy pdf-parse → pdfjs-dist → @napi-rs/canvas into /export/pdf-node_modules
 * for admin Docker runtime (same pattern as sharp/ws).
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();
const exportRoot = join(root, 'export', 'pdf-node_modules');

function copyDir(src, destRelative) {
  const dest = join(exportRoot, destRelative);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[export-pdf] -> ${destRelative}`);
}

function copyPkg(packageName, destRelative) {
  const pkgJson = require.resolve(`${packageName}/package.json`, { paths: [root] });
  copyDir(dirname(pkgJson), destRelative);
}

function copyPkgFromDir(srcDir, destRelative) {
  if (!existsSync(srcDir)) {
    throw new Error(`missing ${srcDir}`);
  }
  copyDir(srcDir, destRelative);
}

mkdirSync(exportRoot, { recursive: true });

copyPkg('@napi-rs/canvas', '@napi-rs/canvas');

try {
  copyPkg('@napi-rs/canvas-linux-x64-gnu', '@napi-rs/canvas-linux-x64-gnu');
} catch {
  console.warn('[export-pdf] @napi-rs/canvas-linux-x64-gnu not found (non-linux build?)');
}

// pdf-parse does not export package.json subpath; resolve entry then dirname
const pdfParseEntry = require.resolve('pdf-parse', { paths: [root] });
copyDir(dirname(pdfParseEntry), 'pdf-parse');

// pdfjs-dist lives in pnpm store (not always hoisted to workspace root)
const pnpmDir = join(root, 'node_modules', '.pnpm');
const pdfjsStore = readdirSync(pnpmDir).find((e) => e.startsWith('pdfjs-dist@'));
if (!pdfjsStore) {
  throw new Error('pdfjs-dist not found under node_modules/.pnpm');
}
copyDir(join(pnpmDir, pdfjsStore, 'node_modules', 'pdfjs-dist'), 'pdfjs-dist');

// Native binding for linux x64 (bookworm admin image)
const canvasNative = readdirSync(pnpmDir).find((e) =>
  e.startsWith('@napi-rs+canvas-linux-x64-gnu@'),
);
if (canvasNative) {
  copyDir(
    join(pnpmDir, canvasNative, 'node_modules', '@napi-rs', 'canvas-linux-x64-gnu'),
    '@napi-rs/canvas-linux-x64-gnu',
  );
} else {
  console.warn('[export-pdf] @napi-rs/canvas-linux-x64-gnu not in pnpm store');
}

if (!existsSync(join(exportRoot, '@napi-rs/canvas/package.json'))) {
  console.error('[export-pdf] @napi-rs/canvas export failed');
  process.exit(1);
}

console.log('[export-pdf] done');
