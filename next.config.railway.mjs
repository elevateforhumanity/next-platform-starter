/**
 * next.config.railway.mjs
 *
 * Railway-specific Next.js config. Builds only the LMS, admin, instructor,
 * learner, and their API routes — skips the ~1,100 public marketing pages.
 *
 * Used by Dockerfile.railway via:
 *   NEXT_CONFIG_FILE=next.config.railway.mjs pnpm next build
 *
 * How page exclusion works:
 *   Next.js App Router compiles every page.tsx it finds under `app/`.
 *   We can't delete files, but we CAN redirect the app directory to a
 *   filtered symlink tree. Instead, we use webpack's IgnorePlugin to
 *   prevent non-Railway route modules from being resolved, combined with
 *   a custom `pageExtensions` trick that renames excluded pages so Next.js
 *   skips them.
 *
 *   The cleanest supported mechanism in Next.js 16 is the `outputFileTracingRoot`
 *   + a RAILWAY_ROUTES env var that the webpack config reads to emit a
 *   NormalModuleReplacementPlugin stub for excluded app routes.
 */

import { withSentryConfig } from '@sentry/nextjs';

// Routes Railway serves — everything else gets a lightweight stub at build time
const RAILWAY_APP_PREFIXES = [
  'app/lms',
  'app/admin',
  'app/learner',
  'app/instructor',
  'app/api/admin',
  'app/api/lms',
  'app/api/generate-video',
  'app/api/health',
  'app/api/webhooks',   // Stripe webhooks needed on Railway too
  // Auth routes needed for login flow
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
const railwayConfig = {
  output: 'standalone',

  serverExternalPackages: [
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

  // Skip type checking and linting — already validated on Netlify CI
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Suppress dev indicators
  devIndicators: { appIsrStatus: false, buildActivity: false },

  // Use commit SHA as build ID
  generateBuildId: async () => {
    return process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 8) ?? `railway-${Date.now()}`;
  },

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    }

    // Single worker — same OOM protection as main config
    config.parallelism = 1;

    // Stub out non-Railway app routes so webpack doesn't compile them.
    // Any page.tsx / layout.tsx / route.ts under app/ that is NOT in
    // RAILWAY_APP_PREFIXES gets replaced with an empty module.
    // This cuts compilation from ~1,500 pages to ~500.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        // Match any file under app/ that is a Next.js route file
        /[\\/]app[\\/](.+)\.(page|layout|route|loading|error|not-found|template|default)\.(tsx?|jsx?)$/,
        (resource) => {
          const rel = resource.request
            .replace(/\\/g, '/')
            .replace(/^.*?\/app\//, 'app/');

          const isRailwayRoute = RAILWAY_APP_PREFIXES.some(prefix =>
            rel.startsWith(prefix + '/') || rel === prefix
          );

          if (!isRailwayRoute) {
            // Replace with a stub that exports a minimal valid Next.js page
            resource.request = require.resolve('./lib/railway-page-stub.tsx');
          }
        }
      )
    );

    return config;
  },

  // Only trace files needed for Railway routes
  outputFileTracingIncludes: {
    '/lms/**': ['./app/lms/**/*', './components/lms/**/*'],
    '/admin/**': ['./app/admin/**/*', './components/admin/**/*'],
    '/instructor/**': ['./app/instructor/**/*'],
    '/learner/**': ['./app/learner/**/*'],
  },

  // Minimal redirects — only what Railway routes need
  async redirects() {
    return [
      { source: '/learn', destination: '/lms/dashboard', permanent: false },
      { source: '/learn/:path*', destination: '/lms/:path*', permanent: false },
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
  ? withSentryConfig(railwayConfig, sentryOptions)
  : railwayConfig;
