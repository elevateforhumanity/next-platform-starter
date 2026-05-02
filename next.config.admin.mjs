/**
 * next.config.admin.mjs
 *
 * Railway admin service — builds only /admin, /instructor, /api/admin,
 * and shared auth routes. ~400 pages vs 1,500 on Netlify.
 *
 * Used by Dockerfile.admin via config file swap before pnpm next build.
 */

import { withSentryConfig } from '@sentry/nextjs';

const ADMIN_PREFIXES = [
  'app/admin',
  'app/instructor',
  'app/api/admin',
  'app/api/health',
  'app/api/webhooks',
  // Auth — needed for admin login flow
  'app/(auth)',
  'app/login',
  'app/signup',
  'app/reset',
  'app/reset-password',
  'app/verify-email',
  'app/accept-invite',
  'app/unauthorized',
];

/** @type {import('next').NextConfig} */
const adminConfig = {
  output: 'standalone',

  serverExternalPackages: [
    'remotion',
    '@remotion/core',
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/cli',
    '@remotion/compositor-linux-x64-gnu',
    'sharp',
    'pdf-parse',
    'pdfkit',
    'pdf-lib',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'pg',
    'openai',
    'stripe',
    'ioredis',
    'redis',
    '@upstash/redis',
    '@upstash/ratelimit',
    '@sendgrid/mail',
    'nodemailer',
    'resend',
    '@sentry/nextjs',
    '@sentry/node',
    '@sentry/node-core',
    '@sentry/core',
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/compositor-linux-x64-gnu',
    'remotion',
    'puppeteer',
    'puppeteer-core',
    'jsdom',
    'typescript',
    'canvas',
    'tesseract.js',
    'tesseract.js-core',
    'edge-tts',
    'ffmpeg-static',
  ],

  typescript: { ignoreBuildErrors: true },
  devIndicators: { position: 'bottom-right' },

  generateBuildId: async () =>
    process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 8) ?? `admin-${Date.now()}`,

  // Next.js 16 uses Turbopack by default
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    }
    config.parallelism = 1;
    return config;
  },

  async redirects() {
    return [
      { source: '/admin/login', destination: '/login?redirect=/admin/dashboard', permanent: false },
    ];
  },
};

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: false,
  disableLogger: true,
  automaticVercelMonitors: false,
};

export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(adminConfig, sentryOptions)
  : adminConfig;
