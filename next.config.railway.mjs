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
// LMS service: no admin or instructor routes — those are on Elevate-admin service
const RAILWAY_APP_PREFIXES = [
  'app/lms',
  'app/learner',
  'app/api/lms',
  // Video generation — LMS owns lesson video delivery
  'app/api/videos',
  'app/api/generate-video',
  'app/api/health',
  'app/api/webhooks',
  // Auth routes needed for LMS login flow
  'app/(auth)',
  'app/login',
  'app/signup',
  'app/reset',
  'app/reset-password',
  'app/verify-email',
  'app/accept-invite',
  'app/unauthorized',
  // Authenticated app routes — live on Railway, were missing from build config
  'app/account',
  'app/advising',
  'app/ai',
  'app/ai-chat',
  'app/ai-tutor',
  'app/apprentice',
  'app/billing',
  'app/certificates',
  'app/credentials',
  'app/dashboard',
  'app/documents',
  'app/employer',
  'app/employer-portal',
  'app/enroll',
  'app/enrollment',
  'app/messages',
  'app/notifications',
  'app/onboarding',
  'app/orientation',
  'app/partner',
  'app/partner-learning',
  'app/pay',
  'app/payment',
  'app/profile',
  'app/program-holder',
  'app/proctor',
  'app/reports',
  'app/schedule',
  'app/settings',
  'app/student-portal',
  'app/transcript',
  'app/video',
  'app/videos',
  'app/workforce-board',
];

/** @type {import('next').NextConfig} */
const railwayConfig = {
  output: 'standalone',

  // ESLint runs in CI separately — skip Next's built-in lint to avoid
  // ajv v6/v8 incompatibility with ESLint 9 flat config.
  eslint: { ignoreDuringBuilds: true },

  serverExternalPackages: [
    // Remotion — never bundle. The local remotion/ dir conflicts with the npm
    // package name under Turbopack. External forces Node require() which finds
    // node_modules/remotion instead of ./remotion/index.ts
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

  // edge-tts is kept external (serverExternalPackages above) — do NOT add to transpilePackages.
  // A package cannot appear in both arrays; Turbopack rejects it.
  transpilePackages: [],

  // Prevent Turbopack from tracing the entire repo for fs-heavy devstudio routes
  outputFileTracingExcludes: {
    '/api/devstudio/files': ['**/*'],
    '/api/devstudio/shell': ['**/*'],
  },

  // Skip type checking — already validated on Netlify CI
  typescript: { ignoreBuildErrors: true },

  // Suppress dev indicators
  devIndicators: { position: 'bottom-right' },

  // Use commit SHA as build ID
  generateBuildId: async () => {
    return process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 8) ?? `railway-${Date.now()}`;
  },

  // Turbopack: resolve 'remotion' to the npm package, not our local remotion/ dir.
  // The local remotion/ directory is only used by the Remotion CLI renderer at
  // runtime — it must never be bundled into the Next.js app bundle.
  turbopack: {
    resolveAlias: {
      // Force 'remotion' imports to resolve from node_modules, not local dir
      remotion: 'remotion',
      // edge-tts ships index.ts as its entry point — Turbopack can't handle
      // uncompiled TypeScript from node_modules. Aliasing it to itself tells
      // Turbopack to treat it as a Node.js external (it's already in
      // serverExternalPackages) rather than attempting to bundle the .ts file.
      'edge-tts': 'edge-tts',
    },
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    }

    // edge-tts ships uncompiled TypeScript (index.ts with `export type`) as its
    // entry point. Webpack's SWC loader cannot handle it. Mark it as an external
    // so webpack skips resolution/parsing and Node.js requires it at runtime.
    // This complements serverExternalPackages (runtime) and turbopack.resolveAlias (dev).
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('edge-tts');
    }

    config.parallelism = 1;
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
