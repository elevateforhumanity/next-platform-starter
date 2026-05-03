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

  experimental: {
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
  },

  serverExternalPackages: [
    'sharp',
    'ffmpeg-static',
    '@sparticuz/chromium',
    'puppeteer-core',
  ],

  devIndicators: { position: 'bottom-right' },
};

export default adminConfig;
