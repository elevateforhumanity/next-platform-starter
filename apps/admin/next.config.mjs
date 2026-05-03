/**
 * apps/admin/next.config.mjs
 *
 * Standalone Next.js app for admin/instructor/staff/internal APIs.
 * Shared code (lib/, components/, types/) lives at the repo root and is
 * imported via the @/* path alias which resolves to ../../*.
 *
 * Route scope: ~675 routes (admin, instructor, staff, analytics, cron,
 * reports, export, audit) — down from 2,706 in the monolith.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const adminConfig = {
  output: 'standalone',

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Resolve @/* to repo root so shared lib/, components/, types/ work
  webpack(config) {
    config.resolve.alias['@'] = ROOT;
    return config;
  },

  // Standalone output needs to include shared node_modules from root
  outputFileTracingRoot: ROOT,

  outputFileTracingIncludes: {
    '/**': [
      `${ROOT}/lib/**`,
      `${ROOT}/components/**`,
      `${ROOT}/types/**`,
      `${ROOT}/data/**`,
      `${ROOT}/config/**`,
      `${ROOT}/hooks/**`,
      `${ROOT}/context/**`,
      `${ROOT}/public/**`,
    ],
  },

  serverExternalPackages: [
    // Remotion — ships native binaries and .mjs workers webpack can't bundle
    'remotion',
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/studio',
    '@remotion/compositor-linux-x64-gnu',
    '@remotion/core',
    '@remotion/cli',
    // rspack — bundled by remotion, has native bindings
    '@rspack/core',
    '@rspack/binding',
    '@rspack/binding-linux-x64-gnu',
    // esbuild — .d.ts files get picked up by webpack, must stay external
    'esbuild',
    // Other heavy server-only deps
    'sharp',
    'ffmpeg-static',
    '@sparticuz/chromium',
    'puppeteer',
    'puppeteer-core',
    'playwright',
    'tesseract.js',
    'tesseract.js-core',
    'pdf-parse',
    'pdfkit',
    'pdf-lib',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'openai',
    'stripe',
    'ioredis',
    '@upstash/redis',
    '@upstash/ratelimit',
    '@sendgrid/mail',
    'nodemailer',
    'resend',
    '@octokit/rest',
    '@octokit/auth-oauth-app',
    'socket.io',
    'yjs',
    'y-websocket',
    'typescript',
  ],

  devIndicators: { position: 'bottom-right' },
};

export default adminConfig;
