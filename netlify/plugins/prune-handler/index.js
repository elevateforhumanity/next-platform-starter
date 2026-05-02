/**
 * Netlify build plugin: prune-handler
 *
 * Runs onPostBuild — after @netlify/plugin-nextjs onBuild has copied
 * .next/standalone into the handler directory, but before Netlify zips
 * and uploads the function.
 *
 * Only removes packages that are 100% build-time or browser-only.
 * Never removes packages that routes require() at runtime.
 */

const { rm, readdir } = require('fs/promises');
const { join } = require('path');
const { existsSync, readdirSync, statSync } = require('fs');

const PRUNE_PACKAGES = [
  // Next.js SWC compiler platform binaries (113 MB each, build-time only)
  '@next/swc-linux-x64-gnu',
  '@next/swc-linux-x64-musl',
  '@next/swc-darwin-x64',
  '@next/swc-darwin-arm64',
  '@next/swc-win32-x64-msvc',
  // esbuild / webpack (build-time only)
  '@esbuild',
  'esbuild',
  'webpack',
  'webpack-sources',
  // SWC compiler — NOT @swc/helpers (required by Next.js at runtime)
  '@swc/core',
  '@swc/cli',
  // Browser automation
  'puppeteer',
  'puppeteer-core',
  'playwright',
  'playwright-core',
  'chromium-bidi',
  '@playwright',
  '@sparticuz',
  'chrome-aws-lambda',
  // Browser-only 3D / media
  'three',
  'three-stdlib',
  '@react-three',
  'hls.js',
  'video.js',
  '@mediapipe',
  // Browser-only UI
  // NOTE: lucide-react is NOT pruned — 1,231 server-component imports across app/
  // NOTE: recharts is NOT pruned — used in admin/reports/ReportsDashboard.tsx (SSR hydration)
  'monaco-editor',
  '@monaco-editor',
  'html2canvas',
  // Dev / test tools
  'typescript',
  'prettier',
  'eslint',
  '@typescript-eslint',
  'vitest',
  'jest',
  '@jest',
  '@storybook',
  'jsdom',
  'happy-dom',
  // Sentry CLI binary only (keep @sentry/nextjs, @sentry/node — used at runtime)
  '@sentry/cli-linux-x64',
  '@sentry/cli',
  // WebContainer (browser-only sandbox)
  '@webcontainer',
  // NOTE: yjs, y-protocols, lib0 are NOT pruned — lib/collaboration/yjs-provider.ts
  // imports yjs directly and is bundled into the server handler for SSR.
];

async function pruneNodeModules(nodeModulesDir) {
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
  // Prune pnpm virtual store entries
  const pnpmDir = join(nodeModulesDir, '.pnpm');
  if (existsSync(pnpmDir)) {
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
  }
  return removed;
}

function findNodeModules(dir, depth = 0) {
  if (depth > 6 || !existsSync(dir)) return [];
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry === 'node_modules') {
      results.push(join(dir, entry));
      continue;
    }
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) results.push(...findNodeModules(full, depth + 1));
    } catch {}
  }
  return results;
}

module.exports = {
  onPostBuild: async ({ constants }) => {
    const cwd = process.cwd();
    const netlifyDir = join(cwd, '.netlify');

    if (!existsSync(netlifyDir)) {
      console.log('[prune-handler] .netlify/ not found — skipping');
      return;
    }

    const handlerPath = join(netlifyDir, 'functions-internal', '___netlify-server-handler');
    console.log(`[prune-handler] handler exists: ${existsSync(handlerPath)}`);

    const nodeModulesDirs = findNodeModules(netlifyDir);
    console.log(
      `[prune-handler] found ${nodeModulesDirs.length} node_modules dirs under .netlify/`,
    );

    let total = 0;
    for (const nm of nodeModulesDirs) {
      console.log(`[prune-handler] pruning ${nm}`);
      total += await pruneNodeModules(nm);
    }
    console.log(`[prune-handler] done — removed ${total} packages`);
  },
};
