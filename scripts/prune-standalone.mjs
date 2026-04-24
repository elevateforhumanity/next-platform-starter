/**
 * Prune build-time-only and browser-only packages from .next/standalone.
 *
 * IMPORTANT: standalone/node_modules is the RUNTIME bundle. Only remove
 * packages that are 100% never needed at request time. If a package is in
 * serverExternalPackages it is loaded via require() at runtime — do NOT
 * remove it from standalone.
 *
 * Safe to remove: Next.js build binaries, browser-only packages, dev tools.
 * Never remove: anything a route requires() at runtime.
 */

import { rm, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const STANDALONE_NODE_MODULES = resolve('.next/standalone/node_modules');

const PRUNE_PACKAGES = [
  // ── Next.js SWC compiler platform binaries (113 MB each, build-time only) ──
  '@next/swc-linux-x64-gnu',
  '@next/swc-linux-x64-musl',
  '@next/swc-darwin-x64',
  '@next/swc-darwin-arm64',
  '@next/swc-win32-x64-msvc',
  // ── Remotion + native compositor binaries (Railway-only, ~80MB) ─────────────
  'remotion',
  '@remotion',
  // ── TTS + FFmpeg (Railway-only, native binaries) ─────────────────────────────
  'edge-tts',
  'ffmpeg-static',
  '@ffmpeg',
  // ── esbuild binary (build-time only) ────────────────────────────────────────
  '@esbuild',
  'esbuild',
  // ── webpack (build-time only) ────────────────────────────────────────────────
  'webpack',
  'webpack-sources',
  // ── SWC compiler (NOT @swc/helpers — that is required by Next.js at runtime) ─
  '@swc/core',
  '@swc/cli',
  // ── Browser automation (never runs server-side) ──────────────────────────────
  'puppeteer',
  'puppeteer-core',
  'playwright',
  'playwright-core',
  'chromium-bidi',
  '@playwright',
  '@sparticuz',
  'chrome-aws-lambda',
  // ── Browser-only 3D / media ──────────────────────────────────────────────────
  'three',
  'three-stdlib',
  '@react-three',
  'hls.js',
  'video.js',
  '@mediapipe',
  // ── Browser-only UI (never imported server-side) ─────────────────────────────
  'monaco-editor',
  '@monaco-editor',
  'lucide-react',
  'recharts',
  'html2canvas',
  // ── node-pty — terminal emulator, not needed in Lambda ───────────────────────
  'node-pty',
  // ── 3D / physics (browser-only) ──────────────────────────────────────────────
  'three',
  'three-stdlib',
  '@react-three',
  '@dimforge',
  // ── PDF (client-side generators) ─────────────────────────────────────────────
  'jspdf',
  'pdfjs-dist',
  'pdfkit',
  'fontkit',
  'hyphen',
  // ── Video / media (browser-only) ─────────────────────────────────────────────
  'hls.js',
  'hls',
  'video.js',
  '@videojs',
  'mediabunny',
  // ── Native canvas binding ─────────────────────────────────────────────────────
  'canvas',
  '@napi-rs',
  // ── ML vision (browser/native only) ──────────────────────────────────────────
  '@mediapipe',
  // ── PDF text extractor ────────────────────────────────────────────────────────
  'pdf-parse',
  // ── Sentry CLI binary (build-time only) ──────────────────────────────────────
  '@sentry/cli',
  // ── Code formatter (build-time only) ─────────────────────────────────────────
  'prettier',
  // ── Utility lib (tree-shaken at build, not needed at runtime) ────────────────
  'es-toolkit',
  // ── Polyfill not needed in modern Node ───────────────────────────────────────
  'web-streams-polyfill',
  // ── SWC compiler (build-time only) ───────────────────────────────────────────
  '@swc/core',
  '@swc/cli',
  // ── rspack — Turbopack/webpack build tool ────────────────────────────────────
  '@rspack',
  // ── Dev / test tools ─────────────────────────────────────────────────────────
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
  // ── Sentry CLI binary (not the SDK — keep @sentry/nextjs, @sentry/node) ──────
  '@sentry/cli-linux-x64',
  '@sentry/cli',
  // ── WebContainer (browser-only) ──────────────────────────────────────────────
  '@webcontainer',
  // ── Collaborative editing (browser-only) ─────────────────────────────────────
  'yjs',
  'y-protocols',
  'lib0',
];

async function pruneDir(nodeModulesDir) {
  if (!existsSync(nodeModulesDir)) {
    console.log(`[prune-standalone] ${nodeModulesDir} does not exist — skipping`);
    return;
  }

  let totalRemoved = 0;

  for (const pkg of PRUNE_PACKAGES) {
    const pkgPath = join(nodeModulesDir, pkg);
    if (existsSync(pkgPath)) {
      try {
        await rm(pkgPath, { recursive: true, force: true });
        totalRemoved++;
        console.log(`[prune-standalone] removed ${pkg}`);
      } catch (err) {
        console.warn(`[prune-standalone] failed to remove ${pkg}: ${err.message}`);
      }
    }
  }

  // Prune pnpm virtual store entries
  const pnpmDir = join(nodeModulesDir, '.pnpm');
  if (existsSync(pnpmDir)) {
    const entries = await readdir(pnpmDir);
    for (const entry of entries) {
      const shouldPrune = PRUNE_PACKAGES.some(pkg => {
        const pnpmName = pkg.startsWith('@') ? pkg.replace('/', '+') : pkg;
        return entry.startsWith(pnpmName + '@') || entry === pnpmName;
      });
      if (shouldPrune) {
        try {
          await rm(join(pnpmDir, entry), { recursive: true, force: true });
          totalRemoved++;
          console.log(`[prune-standalone] removed .pnpm/${entry}`);
        } catch (err) {
          console.warn(`[prune-standalone] failed to remove .pnpm/${entry}: ${err.message}`);
        }
      }
    }
  }

  console.log(`[prune-standalone] done — removed ${totalRemoved} packages from ${nodeModulesDir}`);
}

await pruneDir(STANDALONE_NODE_MODULES);
