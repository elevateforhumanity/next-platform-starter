/**
 * Netlify build plugin: prune-handler
 *
 * Runs after @netlify/plugin-nextjs onBuild to remove heavy packages from
 * .netlify/functions-internal/___netlify-server-handler/node_modules before
 * Netlify zips and uploads the function.
 *
 * These packages are build-time only, browser-only, or handled by separate
 * Netlify functions. They must not be in the Lambda bundle.
 */

const { rm, readdir } = require('fs/promises');
const { join } = require('path');
const { existsSync } = require('fs');

const PRUNE_PACKAGES = [
  // Next.js build-time binaries (SWC compiler — 113 MB)
  '@next/swc-linux-x64-gnu',
  '@next/swc-linux-x64-musl',
  '@next/swc-darwin-x64',
  '@next/swc-darwin-arm64',
  '@next/swc-win32-x64-msvc',
  // esbuild, webpack — build-only
  '@esbuild',
  'webpack',
  'webpack-sources',
  '@swc',
  // Google APIs (194 MB)
  'googleapis',
  'google-auth-library',
  // OCR (44 MB wasm)
  'tesseract.js',
  'tesseract.js-core',
  // Sharp / image (native binaries)
  'sharp',
  '@img',
  '@napi-rs',
  // Canvas
  'canvas',
  // PDF
  'pdf-lib',
  'pdf-parse',
  'pdfkit',
  'pdfjs-dist',
  'jspdf',
  '@react-pdf',
  // FFmpeg binaries
  '@ffmpeg-installer',
  '@ffprobe-installer',
  'fluent-ffmpeg',
  // Browser automation
  'puppeteer',
  'puppeteer-core',
  'playwright',
  'playwright-core',
  'chromium-bidi',
  '@playwright',
  '@sparticuz',
  'chrome-aws-lambda',
  // Editor / terminal
  'monaco-editor',
  'node-pty',
  // Video / media (browser-only)
  'video.js',
  'hls.js',
  // MediaPipe (browser-only)
  '@mediapipe',
  // 3D (browser-only)
  'three',
  'three-stdlib',
  '@react-three',
  // Icons (browser-only, 42 MB)
  'lucide-react',
  // Charting (browser-only)
  'recharts',
  // Screenshot (browser-only)
  'html2canvas',
  // Sentry CLI binary
  '@sentry/cli-linux-x64',
  // Build / dev tools
  'typescript',
  'core-js',
  'prettier',
  'tailwindcss',
  'autoprefixer',
  'postcss',
  'eslint',
  '@typescript-eslint',
  'vitest',
  // DOM / test
  'jsdom',
  'happy-dom',
  // Document generation
  'docx',
  'mammoth',
  // Collaborative editing (browser-only)
  'yjs',
  'y-protocols',
  'lib0',
  // WebContainer (browser-only)
  '@webcontainer',
  // Misc
  '@mailchimp',
  'csv-parse',
  'sitemap',
  'jszip',
  'fast-xml-parser',
  'marked',
  'cheerio',
  // Heavy SDKs — in serverExternalPackages, loaded from node_modules not bundled
  'openai',
  'stripe',
  '@aws-sdk',
  '@smithy',
  'ioredis',
  '@upstash',
  '@redis',
  '@sendgrid',
  'nodemailer',
  'resend',
  '@sentry',
  '@opentelemetry',
  'socket.io',
  'socket.io-client',
  'engine.io',
  // Build tools
  'esbuild',
  'rollup',
  'turbopack',
  // Test tools
  'jest',
  '@jest',
  '@storybook',
];

async function pruneDir(nodeModulesDir) {
  if (!existsSync(nodeModulesDir)) return 0;
  let removed = 0;
  for (const pkg of PRUNE_PACKAGES) {
    const pkgPath = join(nodeModulesDir, pkg);
    if (existsSync(pkgPath)) {
      await rm(pkgPath, { recursive: true, force: true });
      console.log(`  [prune-handler] removed ${pkg}`);
      removed++;
    }
  }
  return removed;
}

async function prunePnpm(pnpmDir) {
  if (!existsSync(pnpmDir)) return 0;
  let removed = 0;
  const entries = await readdir(pnpmDir);
  for (const entry of entries) {
    const matches = PRUNE_PACKAGES.some((pkg) => {
      const pnpmPkg = pkg.startsWith('@') ? pkg.replace('/', '+') : pkg;
      return entry.startsWith(pnpmPkg + '@') || entry === pnpmPkg;
    });
    if (matches) {
      await rm(join(pnpmDir, entry), { recursive: true, force: true });
      console.log(`  [prune-handler] removed .pnpm/${entry}`);
      removed++;
    }
  }
  return removed;
}

module.exports = {
  onPostBuild: async ({ constants }) => {
    try {
      const cwd = process.cwd();

      // Candidate handler directories — @netlify/plugin-nextjs v4 and v5 paths
      const candidates = [
        join(cwd, '.netlify', 'functions-internal', '___netlify-server-handler'),
        join(cwd, '.netlify', 'v1', 'functions', '___netlify-server-handler'),
        // Fallback using PUBLISH_DIR when set
        ...(constants.PUBLISH_DIR
          ? [
              join(
                constants.PUBLISH_DIR,
                '..',
                '.netlify',
                'functions-internal',
                '___netlify-server-handler',
              ),
            ]
          : []),
      ];

      const dirs = candidates.filter((d) => existsSync(d));

      if (dirs.length === 0) {
        console.log(
          '[prune-handler] handler directory not found — skipping (bundle size unchanged)',
        );
        candidates.forEach((d) => console.log('[prune-handler] searched:', d));
        return;
      }

      // Log handler size before pruning
      try {
        const { execSync } = require('child_process');
        const sizeBefore = execSync(`du -sh ${dirs[0]} 2>/dev/null || echo 'unknown'`)
          .toString()
          .trim();
        console.log(`[prune-handler] handler size BEFORE: ${sizeBefore}`);
      } catch {}

      let total = 0;
      for (const dir of dirs) {
        console.log(`[prune-handler] pruning ${dir}`);
        const nm = join(dir, 'node_modules');
        total += await pruneDir(nm);
        total += await prunePnpm(join(nm, '.pnpm'));

        // Check one level of nested node_modules
        if (existsSync(dir)) {
          const entries = await readdir(dir).catch(() => []);
          for (const entry of entries) {
            if (entry === 'node_modules') continue;
            const nested = join(dir, entry, 'node_modules');
            if (existsSync(nested)) {
              total += await pruneDir(nested);
              total += await prunePnpm(join(nested, '.pnpm'));
            }
          }
        }
      }

      // Log handler size after pruning
      try {
        const { execSync } = require('child_process');
        const sizeAfter = execSync(`du -sh ${dirs[0]} 2>/dev/null || echo 'unknown'`)
          .toString()
          .trim();
        console.log(`[prune-handler] handler size AFTER: ${sizeAfter}`);
      } catch {}
      console.log(`[prune-handler] done — removed ${total} packages`);
    } catch (err) {
      // Never fail the build — pruning is best-effort
      console.warn('[prune-handler] non-fatal error:', err.message);
    }
  },
};
