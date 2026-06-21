import { withSentryConfig } from '@sentry/nextjs';
import fs from 'node:fs';
import path from 'node:path';
import {
  lmsOnlyStandaloneTraceExcludes,
  sharedStandaloneTraceExcludes,
} from './scripts/next-standalone-trace-excludes.mjs';

const useStandaloneOutput =
  process.env.GITHUB_ACTIONS !== 'true' || process.env.NEXT_STANDALONE_OUTPUT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Next's built-in lint step during build — ESLint runs separately
  // Server external packages - exclude heavy dependencies from the server bundle
  // These are loaded at runtime instead of being bundled, reducing Lambda size
  serverExternalPackages: [
    'tesseract.js',
    'tesseract.js-core',
    'sharp',
    'pdf-parse',
    'pdfjs-dist',
    '@napi-rs/canvas',
    'pdfkit',
    'pdf-lib',
    'jspdf',
    'jspdf-autotable',
    '@react-pdf/renderer',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'pg',
    'openai',
    'stripe',
    'ioredis',
    'redis',
    '@upstash/redis',
    'socket.io',
    'socket.io-client',
    '@sendgrid/mail',
    'nodemailer',
    '@sentry/nextjs',
    '@sentry/node',
    '@sentry/node-core',
    '@sentry/core',
    // Hard runtime require() inside @sentry/node-core — must travel with it
    '@apm-js-collab/tracing-hooks',
    '@apm-js-collab/code-transformer',
    // Remotion + its native bundler deps — ship .node binaries webpack cannot parse.
    // The route uses a dynamic import() so webpack never traces these at build time,
    // but listing them here ensures they are never accidentally inlined if the
    // dynamic import boundary is ever removed.
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/compositor-linux-x64-gnu',
    '@rspack/core',
    '@rspack/binding',
    '@rspack/binding-linux-x64-gnu',
    'remotion',
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    'puppeteer',
    'puppeteer-core',
    'playwright',
    'chromium-bidi',
    'typescript',
    'core-js',
    // Server-only packages — confirmed not used in any 'use client' component
    '@upstash/ratelimit',
    '@mailchimp/mailchimp_marketing',
    '@octokit/rest',
    '@octokit/auth-oauth-app',
    '@webcontainer/api',
    'cheerio',
    'docx',
    'fast-xml-parser',
    'jszip',
    'qrcode',
    'resend',
    'speakeasy',
    'web-push',
    'yjs',
    'y-websocket',
  ],

  // Disable dev indicators (static route indicator, build indicator)
  devIndicators: {
    position: 'bottom-right',
  },

  // Use commit SHA as build ID so webpack filesystem cache is reused across
  // retries of the same commit. Falls back to git rev-parse locally so the
  // cache survives between runs on the same commit (Date.now() busted it every time).
  generateBuildId: async () => {
    if (process.env.COMMIT_REF) return process.env.COMMIT_REF;
    if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
    try {
      const { execSync } = await import('child_process');
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return `build-${Date.now()}`;
    }
  },
  // Standalone output is required for Docker/Northflank runtime. GitHub Actions
  // CI builds skip it to avoid long standalone trace collection on this large app.
  ...(useStandaloneOutput ? { output: 'standalone' } : {}),
  // edge-tts ships index.ts as its entry point (uncompiled TypeScript).
  // transpilePackages compiles it so webpack can parse it.
  transpilePackages: ['edge-tts'],

  // Production builds use webpack. Dev uses --turbopack via the dev script.

  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  // Image optimization settings
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [70, 75, 85, 90, 95],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.elevateforhumanity.org' },
      { protocol: 'https', hostname: 'www.elevateforhumanity.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflarestream.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.elevatelms.com' },
      { protocol: 'https', hostname: 'cms-artifacts.artlist.io' },
      { protocol: 'https', hostname: 'cdn1.affirm.com' },
    ],
  },

  // Performance optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Allow cross-origin requests from preview/deploy URLs
  allowedDevOrigins: ['localhost'],

  // Experimental features for better performance
  experimental: {
    // workerThreads and cpus options removed - deprecated and cause build issues
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-'],
    modularizeImports: {
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{member}}',
        skipDefaultConversion: true,
      },
    },
    serverActions: {
      allowedOrigins: [
        'www.elevateforhumanity.org',
        'elevateforhumanity.org',
        'app.elevateforhumanity.org',
        'admin.elevateforhumanity.org',
        '*.elevateforhumanity.org',
        '*.northflank.app',
      ],
    },
    optimizeCss: false,
    // Disabled: requires worker threads to be enabled and properly configured
    // parallelServerCompiles: true,
    // parallelServerBuildTraces: true,
  },

  // Suppress middleware deprecation warning (middleware.ts is still correct for our use case)
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    // Limit parallelism to 1 on all builds — this is a 2,670-file app and
    // webpack holds all in-flight module graphs in memory simultaneously.
    // 2 workers doubles peak heap; 1 worker keeps it manageable.
    config.parallelism = 1;

    // Northflank's allowed ephemeral build storage is not large enough for
    // Next's production webpack filesystem cache on this app. Disable only in
    // container builds; local builds keep the cache for faster iteration.
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
      config.cache = false;
    }

    // Use Next.js default splitChunks — the custom config above was creating
    // one chunk per npm package (name() function), generating thousands of
    // chunks and holding the entire module graph in memory simultaneously.
    // On a 2,500+ page app this caused OOM on every cold build.
    // Let Next.js manage chunking; it's tuned for this scale.
    return config;
  },

  typescript: {
    // OOMs during type-check on 4,450+ files in CI — keep enabled until project is split or memory increased
    ignoreBuildErrors: true,
  },
  // Removed staticPageGenerationTimeout - use route segment config instead
  // See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
  outputFileTracingExcludes: {
    '/api/devstudio/files': ['**/*'],
    '/api/devstudio/shell': ['**/*'],
    '/api/accreditation/report': ['**/*'],
    // Exclude heavy/dev files from ALL routes to reduce bundle size
    '*': [...sharedStandaloneTraceExcludes, ...lmsOnlyStandaloneTraceExcludes],
  },

  // Redirects for consolidated routes
  async redirects() {
    const canonicalRoutesPath = path.join(process.cwd(), 'lib/routes/canonical-routes.json');
    const canonicalConfig = JSON.parse(fs.readFileSync(canonicalRoutesPath, 'utf8'));
    const canonicalAliasRedirects = (canonicalConfig.legacyAliases || []).map((alias) => ({
      source: alias.source,
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      destination: alias.destination,
      permanent: alias.permanent !== false,
    }));

    const imageManifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'scripts/.image-conversion-manifest.json'), 'utf8'),
    );
    const imageJpgRedirects = imageManifest.map((row) => ({
      source: row.origRel,
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      destination: row.webpRel,
      permanent: true,
    }));
    imageJpgRedirects.push(
      {
        source: '/hero-images/how-it-works-hero.jpg',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/hero-images/how-it-works-hero.webp',
        permanent: true,
      },
      {
        source: '/images/alberta-davis.jpg',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/images/alberta-davis.webp',
        permanent: true,
      },
      {
        source: '/images/facilities-new/facility-2.jpg',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/images/facilities-new/facility-1.webp',
        permanent: true,
      },
    );

    return [
      // Durable apex cannot ALIAS to Northflank — canonical host is www (apex uses URL forward in DNS).
      {
        source: '/',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/',
        permanent: true,
      },
      {
        source: '/:path+',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/:path+',
        permanent: true,
      },
      // NOTE: /sign-in and /signin redirects are handled in proxy.ts (middleware)
      // so they work on the live dev-build server. No next.config.mjs entries needed.
      // ============================================
      // MISSING VIDEO ASSETS — redirect local paths to R2 CDN
      // barber-hero-final.mp4 is not in public/videos/ — serve from R2
      // ============================================
      {
        source: '/videos/barber-hero-final.mp4',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero.mp4',
        permanent: false, // 307 so we can swap the asset later without cache lock-in
      },
      // Course path redirects

      { source: '/preview/business-program', destination: '/programs/business', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/preview/esthetician-orientation', destination: '/programs/esthetician-apprenticeship/orientation', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/preview/curriculum', destination: '/programs/hvac-technician/curriculum', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/preview/study-guide', destination: '/programs/hvac-technician/study-guide', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/course-preview/hvac-technician', destination: '/programs/hvac-technician', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/preview/barber-studio', destination: '/programs/barber-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/preview/barber-videos', destination: '/programs/barber-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/courses', destination: '/programs', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/partners/esthetician-host-shop', destination: '/programs/esthetician-apprenticeship/host-shops', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/partners/nail-host-shop', destination: '/programs/nail-technician-apprenticeship/host-shops', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/schools/mesmerized-by-beauty', destination: '/programs', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Admin path redirects

      { source: '/admin/applicants', destination: '/admin/applications', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/leads', destination: '/admin/crm/leads', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/leads/new', destination: '/admin/crm/leads/new', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/syllabus-generator', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/course-templates', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/courses/manage', destination: '/admin/courses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/course-import', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/quiz-builder', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/external-courses', destination: '/admin/courses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/enrollment', destination: '/admin/students', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/users', destination: '/admin/staff', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/contacts', destination: '/admin/crm/contacts', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/campaigns', destination: '/admin/crm/campaigns', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/email-marketing', destination: '/admin/crm/campaigns', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/social-media', destination: '/admin/crm/campaigns', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/marketing', destination: '/admin/crm', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/compliance-audit', destination: '/admin/compliance', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/license', destination: '/admin/licenses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/license-requests', destination: '/admin/licenses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/progress', destination: '/admin/analytics/learning', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/completions', destination: '/admin/analytics/learning', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/outcomes', destination: '/admin/analytics', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/copilot', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/video-manager', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/course-builder', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // ============================================
      // UNIFIED STUDIO — new LMS-hosted studio page
      // ============================================
      { source: '/studio(.*)', destination: '/admin/studio$1', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // ============================================
      // UNIFIED ADMIN DASHBOARD — new LMS-hosted admin dashboard
      // ============================================
      { source: '/admin-dashboard', destination: '/admin/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // ============================================
      // OLD URL ALIASES → CORRECT EXISTING PAGES
      // ============================================
      // /for-students has a dedicated public page — no redirect
      {
        source: '/store/codebase-clone',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/store/licenses#clone',
        permanent: false,
      },
      { source: '/forgotpassword', destination: '/reset-password', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/resetpassword', destination: '/reset-password', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/verifyemail', destination: '/verify-email', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/lms/messages/new', destination: '/lms/messages', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/lms/messages/support/new', destination: '/lms/messages', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /programs/finance-bookkeeping-accounting has a real page — no redirect needed
      // cpr-first-aid HAS its own page — no redirect needed (removed incorrect redirect)
      // cpr-first-aid-hsi redirect lives in next.config.mjs redirects above
      // direct-support-professional HAS its own page — no redirect needed
      // drug-collector HAS its own page — no redirect needed
      // esthetician-apprenticeship is the public landing page
      // /programs/esthetician/* is a live enrollment flow (apply, documents, payment-setup, etc.) — do NOT wildcard redirect
      // forklift now has its own detail page — redirect removed
      // /programs/jri → /partners/jri (JRI is a funding partner page, not a program)
      // /programs/jri has a real 819-line page — no redirect needed
      // phlebotomy HAS its own page — no redirect needed

      // ============================================
      // APP ALIAS REDIRECTS (Rule B: auth/app path renames)
      // Centralized here instead of scattered in-page redirect() calls.
      // proxy.ts handles auth; these are pure path consolidation.
      // ============================================

      // /admin/* — all admin routes are Railway-owned.
      // /admin/* is gated by middleware (proxy.ts) — no redirect needed here.
      // Internal /admin/* → /admin/* path consolidation is handled by Railway's next.config.

      // Apprentice
      { source: '/apprentice/dashboard', destination: '/apprentice', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/apprentice/progress', destination: '/apprentice/hours', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Dashboard
      { source: '/dashboard/sub-offices/new', destination: '/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Employer
      { source: '/employer/apprenticeship', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer/apprenticeship/new', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer/applications', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer/apprentices/new', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer/login', destination: '/login', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer/postings/new', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer/register', destination: '/apply/employer', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // employer-portal → canonical /employer/dashboard (legacy portal consolidation)
      { source: '/employer-portal', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/dashboard', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/jobs', destination: '/employer/jobs', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/applications', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/candidates', destination: '/employer/candidates', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/analytics', destination: '/employer/analytics', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/company', destination: '/employer/company', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/settings', destination: '/employer/settings', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/messages', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/interviews', destination: '/employer/candidates', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/programs', destination: '/employer/opportunities', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/wotc', destination: '/employer/wotc', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-portal/:path*', destination: '/employer/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // LMS
      { source: '/lms/catalog', destination: '/lms/courses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      { source: '/admin/curriculum',        destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/media-studio',      destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/video-generator',   destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/courses/pipeline',  destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/courses/generate',  destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // /lms/programs — real browse page (app/lms/(app)/programs/page.tsx); do not redirect

      // Mentor / Mentorship
      { source: '/mentor', destination: '/mentor/dashboard', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/mentor/apply', destination: '/mentor/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/mentorship/apply', destination: '/apply', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Partner (app-side) - skip /partner-with-us and /partners intermediaries
      { source: '/partner/refer', destination: '/for-providers', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Portal — exact match before wildcard
      {
        source: '/portal/staff/dashboard',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/admin/staff-portal/dashboard',
        permanent: true,
      },

      // Instructor + staff portals live on admin host — fix www deep links at source
      {
        source: '/instructor',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/admin/instructor/dashboard',
        permanent: true,
      },
      {
        source: '/instructor/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/admin/instructor/:path*',
        permanent: true,
      },
      {
        source: '/staff-portal',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/admin/staff-portal/dashboard',
        permanent: true,
      },
      {
        source: '/staff-portal/dashboard',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/admin/staff-portal/dashboard',
        permanent: true,
      },

      // Program holder
      {
        source: '/program-holder/portal',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/dashboard',
        permanent: true,
      },
      {
        source: '/program-holder/portal/attendance',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/dashboard',
        permanent: true,
      },
      {
        source: '/program-holder/portal/live-qa',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/support',
        permanent: true,
      },
      {
        source: '/program-holder/portal/messages',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/support',
        permanent: true,
      },
      {
        source: '/program-holder/portal/reports',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/reports',
        permanent: true,
      },
      {
        source: '/program-holder/portal/students',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/students',
        permanent: true,
      },
      {
        source: '/program-holder/programs/new',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/programs',
        permanent: true,
      },

      // /admin/staff-portal/processes — real Supabase page with staff_processes query, no redirect

      // Student portal
      // /student-portal/messages and /student-portal/settings — real pages with db queries, no redirect
      { source: '/student/support', destination: '/contact', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Governance / compliance aliases
      // /governance/operational-controls has a dedicated public page — no redirect
      {
        source: '/governance/compliance',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/legal/governance/platform-overview',
        permanent: true,
      },
      { source: '/financial-aid', destination: '/funding', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /workforce-board/reports has a dedicated public page — no redirect
      {
        source: '/admin/accreditation/evidence/new',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/admin/accreditation',
        permanent: true,
      },
      { source: '/admin/blog/new', destination: '/admin/blog', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/course-studio', destination: '/admin/studio', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/dight', destination: '/admin/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/dight/:path*', destination: '/admin/dashboard/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/users/invite', destination: '/admin/staff', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      {
        source: '/admin/wioa/documents/upload',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/admin/wioa/documents',
        permanent: true,
      },

      // Framework redirects


      // Normalize "Institute" style routes into the infrastructure model
      { source: '/institute', destination: '/', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/training-institute', destination: '/programs', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /student/dashboard — real 606-line Supabase dashboard, no redirect

      // Fix old hero image paths
      {
        source: '/clear-pathways-hero.jpg',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/clear-path-main-image.jpg',
        permanent: true,
      },
      {
        source: '/images/efh/hero/hero-main.jpg',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/images/hero/hero-main-welcome.jpg',
        permanent: true,
      },
      // /client-portal → /learner/dashboard (SaaS portal page removed)
      {
        source: '/client-portal/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/learner/dashboard',
        permanent: true,
      },
      // /sitemap → /site-map (HTML sitemap page moved to avoid conflict with app/sitemap.ts)
      {
        source: '/sitemap',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/site-map',
        permanent: true,
      },
      // Redirect sitemap-page to sitemap.xml
      {
        source: '/sitemap-page',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/sitemap.xml',
        permanent: true,
      },
      // /home → / (public SEO route)

      // /student, /student/:path*, /learner, /learner/:path*, /lms/:path* →
      // handled by proxy.ts middleware — no redirect needed here.
      // /portal → portal chooser page. Field portals (/portal/apprentice,
      // /portal/healthcare, etc.) are real pages — do NOT wildcard redirect them.
      { source: '/portal', destination: '/portals', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /students has dedicated public pages — do not wildcard redirect to LMS
      { source: '/learners/:path*', destination: '/lms/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      {
        source: '/program-holder-portal/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/:path*',
        permanent: true,
      },
      // Legacy pluralized Program Holder URLs → canonical singular routes
      { source: '/program-holders', destination: '/program-holder', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      {
        source: '/program-holders/portal',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/dashboard',
        permanent: true,
      },
      {
        source: '/program-holders/universal-mou',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/legal/program-host-agreement',
        permanent: true,
      },
      {
        source: '/program-holders/sign-mou',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/sign-mou',
        permanent: true,
      },
      { source: '/program-holders/apply', destination: '/apply/program-holder', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      {
        source: '/program-holders/onboarding',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/onboarding',
        permanent: true,
      },
      {
        source: '/program-holders/training-providers',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder',
        permanent: true,
      },
      {
        source: '/program-holders/acknowledgement',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/program-holder/rights-responsibilities',
        permanent: true,
      },
      { source: '/program-holders/:path*', destination: '/program-holder/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /admin-portal is now a public landing page - no redirect needed
      // /dashboard redirect removed - handled by middleware with auth check

      // Tax consolidation
      { source: '/tax-filing/:path*', destination: '/tax/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/tax-services/:path*', destination: '/tax/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/tax-software/:path*', destination: '/tax/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Program consolidation
      { source: '/programs-catalog/:path*', destination: '/programs/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/program-finder/:path*', destination: '/programs/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/compare-programs/:path*', destination: '/programs/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Program alias redirects removed — canonical program URLs only.
      // Career consolidation
      { source: '/career-fair/:path*', destination: '/career-services/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Partner consolidation
      { source: '/partner-application/:path*', destination: '/partners/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // apply/barber → barber host shop apply
      { source: '/apply/barber', destination: '/partners/barber-host-shop/apply', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Old barbershop-apprenticeship URLs → barber-host-shop
      { source: '/partners/barbershop-apprenticeship/:path*', destination: '/partners/barber-host-shop/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Old cosmetology-partner-shop URLs → cosmetology-host-shop
      { source: '/partners/cosmetology-partner-shop/:path*', destination: '/partners/cosmetology-host-shop/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Old cosmetology-apprenticeship partner URLs → cosmetology-host-shop
      { source: '/partners/cosmetology-apprenticeship/:path*', destination: '/partners/cosmetology-host-shop/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // apply/cosmetology → cosmetology host shop apply
      { source: '/apply/cosmetology', destination: '/partners/cosmetology-host-shop/apply', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      { source: '/partner-courses/:path*', destination: '/partners/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/partner-playbook/:path*', destination: '/partners/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Auth consolidation
      // /reset-password — real password reset form, no redirect

      // Missing public pages — redirect to closest marketing equivalent
      // /apply/student, /apply/program-holder, /apply/employer all have real pages — no redirects
      // /for-employers, /for-agencies, /partnerships, /program-holder, /cna-waitlist — real pages, no redirect
      { source: '/credentials/checksheets', destination: '/programs', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      {
        source: '/credentials/hvac-standards',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/programs/hvac-technician',
        permanent: false,
      },
      { source: '/credentials/:path+', destination: '/programs', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /careers, /donate, /philanthropy — real pages, no redirect
      // /tuition-fees → /tuition
      // /faq, /how-it-works — real pages, no redirect
      { source: '/mission', destination: '/about', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /impact, /site-map, /security-and-data-protection — real pages, no redirect
      // /consumer-education → /resources
      // /equal-opportunity, /federal-compliance, /grievance, /satisfactory-academic-progress, /hire-graduates — real pages, no redirect
      // /apprenticeship-sponsor → /partners/training-provider
      // /events, /schedule — real pages, no redirect
      // /orientation/schedule — real scheduler page with OrientationScheduleClient, no redirect
      // /onboarding/:path* redirect REMOVED — 20+ real pages exist under /onboarding/
      // (learner, instructor, legal, staff, employer, school, mou, start, payroll-setup, handbook)
      // Next.js redirects take priority over page files, so a wildcard here kills all of them.
      // Auth gating is handled by proxy.ts middleware for authenticated routes.
      // /funding/dol — real page, no redirect
      // /funding/federal-programs → /funding
      // /funding/jri — real page, no redirect
      // /funding/state-programs → /funding (canonical-routes.json)
      // /funding/wrg → /funding
      // /jri — real 401-line page, no redirect
      // /partners/jri → /partners
      // /partners/reentry → /partners
      // /partners/sales and /partners/technology — real PublicLandingPage pages, no redirect
      // /partners/workforce → /partners
      // /fssa-partnership-request — real page, no redirect

      // /enroll — real 157-line page with Supabase, no redirect
      // NOTE: /enroll/:path* wildcard intentionally omitted here.
      // Specific /enroll/* overrides are declared in the ENROLL/APPLY CONSOLIDATION
      // block below. A wildcard here would shadow those specific rules.
      { source: '/financial-support', destination: '/funding', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/community/groups', destination: '/community-services', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/community/:path*', destination: '/community-services', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /compliance/:path* — no redirect needed
      // Keep docs wildcard after specific /docs/* redirects to avoid shadowing.
      // /workone-partner-packet → /snap-et-partner
      // Portal redirects:
      //   /checkout/:path*, /lms/:path*, /learner, /learner/:path*, /student, /student/:path*,
      //   /instructor/:path*, /admin/staff-portal/:path*, /case-manager/:path*, /partner/dashboard, /partner/dashboard/*
      // Portal routes (/employer/*, /partner/*, /provider/*, /account/*) are real app pages.
      // Auth gating is handled by proxy.ts — do NOT wildcard-redirect them to /login
      // (that broke authenticated employer/partner dashboards after middleware passed).
      // /employer (marketing landing) and /employer/dashboard (portal) are both real pages.
      // /approvals — real 431-line page, no redirect
      // /admin/:path* — gated by proxy.ts middleware
      // Missing public pages with no Railway equivalent
      // /certiport-exam (350 lines, db=7) and /microclasses (265 lines) — real pages, no redirect
      { source: '/outcomes/indiana', destination: '/about', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /orientation — real 200-line page, no redirect
      // /help and /help/* are real pages — wired in lib/navigation.ts Support dropdown
      // /compliance (327 lines, db=3) and /credentials (584 lines) — real pages, no redirect
      // Legal consolidation
      // /privacy (160 lines), /terms (112 lines), /legal/privacy (100 lines) — real pages, no redirect
      { source: '/legal/terms-of-service', destination: '/legal', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      {
        source: '/legal/governance/lms',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/legal/governance/lms-standards',
        permanent: true,
      },
      {
        source: '/legal/governance/store',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/legal/governance/store-payments',
        permanent: true,
      },
      // All /policies/* sub-pages redirect to canonical /legal/disclosures
      { source: '/policies/grievance', destination: '/grievance', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/policies/:path*', destination: '/legal/disclosures', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /license-agreement (215 lines) — real page, no redirect

      // Pricing / billing consolidation
      // /pricing (206 lines) and /billing (179 lines, db=5) — real pages, no redirect

      // Auth aliases
      // /forgot-password has a dedicated public page — no redirect
      { source: '/partners/login', destination: '/partner/login', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Tax services routes belong in a separate repository.
      // Those routes are not compiled in this deploy.

      // Store / platform aliases
      { source: '/store/trial', destination: '/launch', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/marketplace', destination: '/store/digital', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/store/demo', destination: '/store/demos', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/store/orders', destination: '/store', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/platform/licensing', destination: '/licensing', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /chat (220 lines) — real page, no redirect
      // Collapsed double-hop: /certificates/verify → /cert/verify → /verify
      { source: '/certificates/verify', destination: '/verify', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Verify consolidation
      { source: '/verifycertificate/:path*', destination: '/verify/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Misc redirects
      { source: '/dashboards/:path*', destination: '/lms/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /portals is the public portal hub — do not wildcard to /lms (broke desktop/mobile parity)

      // These brands have their own pages — only redirect sub-paths, not the root
      // /serene-comfort-care/page.tsx exists and redirects to /partners itself
      // /kingdom-konnect/page.tsx exists with full content
      // /urban-build-crew/page.tsx exists with full content
      // /selfish-inc/page.tsx exists with full content

      // Removed routes - financial-aid has its own page now
      { source: '/forums/:path*', destination: '/blog', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /alumni/page.tsx exists (182 lines) — do not redirect away from it
      // { source: '/alumni/:path*', destination: '/about', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /board → /admin and /delegate → /admin are internal routes.
      { source: '/receptionist/:path*', destination: '/admin/staff-portal/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/forum/:path*', destination: '/blog', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /news/page.tsx exists (137 lines) — do not redirect away from it
      // { source: '/news/:path*', destination: '/blog/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Old 404 URLs from Google logs - redirect to relevant pages
      { source: '/about/founder', destination: '/about/team', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/etpl-programs', destination: '/pathways', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /intake (85 lines) — real page, no redirect
      { source: '/home1', destination: '/', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /downloads (465 lines, db=4) — real page, no redirect
      { source: '/docs/students/certificates', destination: '/credentials', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/docs/:path*', destination: '/resources', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /programs/food-handler redirect removed — canonical routes only.

      // ============================================
      // ENROLL / APPLY CONSOLIDATION
      // Single redirect authority — all enroll/apply routing lives here.
      // Order matters: specific paths must come before the catch-all wildcard.
      // ============================================

      // /enroll → /apply is already declared above (permanent:false, early in the list).
      // The permanent:true duplicate below was dead (first match wins). Removed.

      // ── Barber apply canonicalization ─────────────────────────────────────
      // Canonical: /programs/barber-apprenticeship/apply
      // All other entry points 301 to it. Order: specific before catch-all.
      {
        source: '/apply/barber-apprenticeship',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },
      {
        source: '/enroll/barber-apprenticeship',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },
      {
        source: '/apply',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        has: [{ type: 'query', key: 'program', value: 'barber-apprenticeship' }],
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },
      {
        source: '/pwa/barber/enroll',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },
      // /checkout/barber-apprenticeship has a real Stripe checkout page — no redirect needed

      // Catch-all for any remaining /enroll/* paths not matched above.
      // Declared after specific overrides so it does not shadow them.
      // /enroll has dedicated enrollment pages — no wildcard redirect

      // Duplicate student forms → canonical /apply/student
      // /apply/quick → /apply
      // /apply/full has a real 377-line form — no redirect needed

      // Duplicate status pages → canonical /apply/track

      // /apply/confirmation has real Supabase tracking — distinct from /apply/success, no redirect

      // Program holder apply alias
      { source: '/program-holder/apply', destination: '/apply/program-holder', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /program-holder/* pages are real — proxy.ts handles auth; no login wildcard here.

      // /scholarships → /funding (public SEO route)
      { source: '/health-services', destination: '/programs/healthcare', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── Archived duplicate program slugs → canonical ─────────────────────
      { source: '/programs/barber', destination: '/programs/barber-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/barber-2024', destination: '/programs/barber-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/hvac-2024', destination: '/programs/hvac-technician', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/cna-cert', destination: '/programs/cna', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/cna-training', destination: '/programs/cna', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/cosmetology', destination: '/programs/cosmetology-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/nail-technician', destination: '/programs/nail-technician-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/nail-tech-apprenticeship', destination: '/programs/nail-technician-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/peer-recovery-specialist-jri', destination: '/programs/peer-recovery-specialist', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/peer-support', destination: '/programs/peer-recovery-specialist', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/recovery-coach', destination: '/programs/peer-recovery-specialist', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/certified-recovery-specialist', destination: '/programs/peer-recovery-specialist', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/it-support', destination: '/programs/it-help-desk', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/it-support-specialist', destination: '/programs/it-help-desk', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/bookkeeping-fundamentals', destination: '/programs/bookkeeping', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/cpr-cert', destination: '/programs/cpr-first-aid', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/health-safety', destination: '/programs/cpr-first-aid', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/phlebotomy-technician', destination: '/programs/phlebotomy', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/nha-phlebotomy', destination: '/programs/phlebotomy', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/nha-medical-assistant', destination: '/programs/medical-assistant', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/nha-pharmacy-technician', destination: '/programs/pharmacy-technician', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/entrepreneurship-small-business', destination: '/programs/entrepreneurship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/forklift-operator', destination: '/programs/forklift', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/cybersecurity', destination: '/programs/cybersecurity-analyst', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/electrical-technician', destination: '/programs/electrical', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/plumbing-technician', destination: '/programs/plumbing', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/dsp-training', destination: '/programs/direct-support-professional', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/chw-cert', destination: '/programs', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/nrf-riseup', destination: '/programs', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/building-maintenance-wrg', destination: '/programs/building-services-technician', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/programs/construction-trades-certification', destination: '/programs/skilled-trades', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // Donate page has its own content now
      // /resources has dedicated public pages — no wildcard redirect
      {
        source: '/career-uplift-services/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        destination: '/career-services',
        permanent: true,
      },
      // /community/page.tsx exists (371 lines) — do not redirect away from it
      // /video (236 lines, db=4) — real page, no redirect

      // LMS redirects
      { source: '/lms/my-courses', destination: '/lms/courses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ============================================
      // CANONICAL PORTAL REDIRECTS
      // ============================================
      { source: '/student-portal', destination: '/learner/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin-portal', destination: '/login', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/partner-portal', destination: '/partner/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // Marketing redirects
      // /success-stories has a real 419-line page — no redirect needed
      { source: '/for-workforce-boards', destination: '/workforce-board', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/get-started', destination: '/start', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // /admin/* consolidation is Railway-internal — handled there, not here.

      // /outcomes/indiana is a public page — do not redirect it
      // Other outcomes sub-routes redirect to programs until data exists
      // /metrics has a real 173-line page — no redirect needed

      // ============================================
      // DEAD LINK FIXES — public-facing

      // ============================================
      // SEO HUB — PROGRAM PAGE REDIRECTS & HUB ALIAS REDIRECTS
      // ============================================
      { source: '/training/cna', destination: '/programs/cna', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/training/hvac-technician', destination: '/programs/hvac-technician', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /programs/hvac-technician-program redirect removed — canonical routes only.
      { source: '/workforce-training', destination: '/workforce-training-indianapolis', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/workforce-training-indiana', destination: '/workforce-training-indianapolis', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // Collapsed: /wioa-funded-training-indiana itself 301s to /wioa-eligibility, so point straight there (single hop).
      { source: '/wioa-training', destination: '/wioa-eligibility', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/wioa-training-indiana', destination: '/wioa-eligibility', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/wioa-funded-training', destination: '/wioa-eligibility', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/healthcare-training', destination: '/healthcare-training-indianapolis', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/skilled-trades-training', destination: '/skilled-trades-training-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/it-certification-training', destination: '/it-certification-training-indianapolis', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employer-workforce-partnerships', destination: '/employer-workforce-partnerships-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/agency-referral-workforce-training', destination: '/agency-referral-workforce-training-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ============================================
      // DEAD LINK FIXES
      // ============================================
      { source: '/logout', destination: '/login', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/elevate-platform-overview.pdf', destination: '/resources', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/pwa/barber/log-hours', destination: '/programs/barber-apprenticeship', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/pwa/barber/progress', destination: '/programs/barber-apprenticeship', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // Legacy stub pages — redirect at config level to avoid error boundary interference
      { source: '/sheets', destination: '/programs', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/usermanagement', destination: '/admin/reports/users', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/curriculumupload', destination: '/admin/curriculum/upload', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/community', destination: '/community-services', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/pwa/cosmetology', destination: '/programs/cosmetology-apprenticeship', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/hvac', destination: '/programs/hvac-technician', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/industries/healthcare', destination: '/programs/healthcare', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /governance/security has a dedicated public page — no redirect
      { source: '/admin/live-sessions/new', destination: '/admin/dashboard', permanent: false },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/admin/live-sessions', destination: '/admin/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── AUTH DUPLICATES ────────────────────────────────────────────────────
      // Canonical login: /login
      // Canonical signup: /signup
      // Canonical forgot-pw (request form): /reset-password
      // Canonical set-new-password: /auth/reset-password
      { source: '/auth/signin', destination: '/login', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/sign-in', destination: '/login', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/signin', destination: '/login', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/auth/signup', destination: '/signup', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/register', destination: '/signup', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/auth/forgot-password', destination: '/reset-password', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/auth/verify-email', destination: '/verify-email', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      // /update-password duplicates /auth/reset-password (set-new-password form)
      // Internal link in account/settings/security updated to /auth/reset-password directly
      { source: '/update-password', destination: '/auth/reset-password', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── CM → CASE-MANAGER ─────────────────────────────────────────────────
      // /cm was the old case manager namespace. Canonical is /case-manager.
      // Internal links in /cm/learners/[id] updated to /case-manager/participants/[id].
      { source: '/cm', destination: '/case-manager/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/cm/learners/:id', destination: '/case-manager/participants/:id', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/cm/:path*', destination: '/case-manager/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── STUDENT PORTAL DUPLICATES ──────────────────────────────────────────
      // Canonical: /learner/dashboard  (all /student* aliases are consolidated above)

      // ── EMPLOYER DUPLICATES ────────────────────────────────────────────────
      // Canonical: /employer  (employer-portal/* already redirected above)
      // /employers has its own marketing page — NOT redirected to dashboard
      // /employers/post-job etc still redirect to the portal equivalents
      { source: '/employers/post-job', destination: '/employer/post-job', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employers/apprenticeships', destination: '/employer/apprenticeships', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employers/benefits', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/employers/talent-pipeline', destination: '/employer/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── PARTNER PORTAL DUPLICATES ──────────────────────────────────────────
      // Canonical: /partner/dashboard
      { source: '/partner-portal', destination: '/partner/dashboard', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/partner-portal/:path*', destination: '/partner/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── OUT-OF-STATE SEO STUBS → INDIANA (operational HQ: Indianapolis, IN) ─
      { source: '/career-training-illinois', destination: '/career-training-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/career-training-ohio', destination: '/career-training-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/career-training-tennessee', destination: '/career-training-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/career-training-texas', destination: '/career-training-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/community-services-illinois', destination: '/community-services-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/community-services-ohio', destination: '/community-services-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/community-services-tennessee', destination: '/community-services-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/community-services-texas', destination: '/community-services-indiana', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── CERTIFICATE / VERIFY DUPLICATES ────────────────────────────────────
      // Canonical verify: /verify/:certificateId
      { source: '/cert/verify', destination: '/verify', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/cert/verify/:id', destination: '/verify/:id', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/certificates/verify/:id', destination: '/verify/:id', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/verify-credential', destination: '/verify', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/certifications', destination: '/certificates', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/certification', destination: '/certificates', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── PRIVACY/TERMS DUPLICATES ────────────────────────────────────────────
      // Canonical: /legal (has sub-pages for each doc)
      { source: '/privacy', destination: '/legal/privacy', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/privacy-policy', destination: '/legal/privacy', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/terms', destination: '/legal', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/terms-of-service', destination: '/legal', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/eula', destination: '/legal/eula', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/license-agreement', destination: '/legal/license-agreement', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/disclosures', destination: '/legal/disclosures', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── MISC ONE-WORD DUPLICATES ────────────────────────────────────────────
      { source: '/micro-classes', destination: '/microclasses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/donations', destination: '/donate', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/funding-impact', destination: '/funding', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/fundingimpact', destination: '/funding', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/for/students', destination: '/for-students', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/connects', destination: '/connect', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── STORE LICENSES DUPLICATES ─────────────────────────────────────────
      // Canonical: /store/licenses  (more complete at 461 lines)
      { source: '/store/licensing', destination: '/store/licenses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/store/licensing/enterprise', destination: '/store/licenses/enterprise-license', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/store/licensing/managed', destination: '/store/licenses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/store/licenses/managed', destination: '/store/licenses', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
      { source: '/store/licensing/:path*', destination: '/store/licenses/:path*', permanent: true },
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d

      // ── GEOGRAPHIC TRAINING SEO PAGES ─────────────────────────────────────
      // /career-training and /community-services are hub pages; state variants are SEO pages — keep all
    ];
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isPreview =
      process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy';
    const host = process.env.URL || '';

    // No special handling needed - single canonical domain: www.elevateforhumanity.org
    const robotsHeaders = [];

    // Base security headers for all environments
    const securityHeaders = [
      ...robotsHeaders,
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      // X-Frame-Options: DENY in production to prevent clickjacking.
      // Omitted in dev so Dev Studio's iframe preview can load same-origin pages.
      ...(isProduction
        ? [{ key: 'X-Frame-Options', value: 'DENY' }]
        : []),
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          isProduction
            ? "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com https://widget.sezzle.com https://challenges.cloudflare.com"
            : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com https://widget.sezzle.com https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io https://*.r2.dev https://cdn.elevatelms.com https://*.githubusercontent.com https://cdn1.affirm.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://us06web.zoom.us https://*.sentry.io https://www.google-analytics.com https://region1.google-analytics.com",
          "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://us06web.zoom.us https://challenges.cloudflare.com https://*.cloudflarestream.com",
          "media-src 'self' data: blob: https://*.supabase.co https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io https://*.r2.dev https://cdn.elevatelms.com https://*.cloudflarestream.com",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://js.stripe.com",
          // Production: no framing allowed. Dev: allow same-origin for Dev Studio iframe.
          isProduction ? "frame-ancestors 'none'" : "frame-ancestors 'self'",
          'upgrade-insecure-requests',
          // CSP violation reporting endpoint
          'report-uri /api/csp-report',
          'report-to csp-endpoint',
        ].join('; '),
      },
      {
        key: 'Report-To',
        value: JSON.stringify({
          group: 'csp-endpoint',
          max_age: 86400,
          endpoints: [{ url: '/api/csp-report' }],
        }),
      },
    ];

    // Environment-specific robots tag
    if (isPreview) {
      securityHeaders.push({
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow, noarchive',
      });
    } else {
      securityHeaders.push({
        key: 'X-Robots-Tag',
        value: 'noai, noimageai',
      });
    }

    return [
      // Studio route - Cross-Origin Isolation for WebContainer
      {
        source: '/studio/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      {
        source: '/studio',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      // 1a) Public marketing pages — short CDN cache (60s) with stale-while-revalidate.
      //     These pages have no auth, no user-specific data, and change only on deploy.
      //     CDN/proxy caches may serve stale for up to 5 min while revalidating in background.
      {
        source: '/(|about|about/mission|about/team|about/partners|blog|careers|contact|credentials|dmca|donate|eligibility|faq|for-employers|for-students|how-it-works|jri|news|partners|press|resources|scholarships|services|site-map|training|transparency|tuition|verify|workkeys|mobile-app|install-app|career-training-indiana|certification-testing|check-eligibility|call-now|career-assessment|career-counseling|workforce-training-indianapolis|healthcare-training-indianapolis|skilled-trades-training-indiana|it-certification-training-indianapolis|employer-workforce-partnerships-indiana|agency-referral-workforce-training-indiana|wioa-eligibility)',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      // 1b) Program landing pages — same short cache
      {
        source: '/programs/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      // 1c) All other app routes — no-store (auth pages, portals, API, LMS)
      {
        source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|studio|programs).*)',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },

      // 2) Allow hashed Next static assets to be cached long-term (safe)
      {
        source: '/_next/static/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },

      // 3) Next image optimizer - short cache with revalidation
      {
        source: '/_next/image',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },

      // 4) Safety: prevent accidental long-caching of direct CSS/JS files at root
      {
        source: '/:path*.css',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/:path*.js',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },

      // Override X-Robots-Tag for images and videos
      {
        source: '/images/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
      {
        source: '/videos/:path*',
dmin/dight/d
dmin/course-generator/d
dmin/autopilot/d
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
    ];
  },
};

// Skip withSentryConfig when
// both plugins are disabled, adding loaders and instrumentation overhead
// that pushes the build over the 8GB heap limit.
// Sentry still initialises at runtime via instrumentation.ts + instrumentation-client.ts.
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Disable auto-instrumentation of proxy.ts — Sentry's wrappingLoader breaks
  // the 'proxy' export required by Next.js 16 when it wraps this file.
  // Sentry still initialises at runtime via instrumentation.ts.
  autoInstrumentMiddleware: false,
  // Disable webpack build worker — Sentry overrides the Next.js config setting.
  // Without this, Sentry spawns a child webpack worker that doubles memory usage
  // and OOM-kills the build even on 16GB machines.
  webpack: {
    autoInstrumentMiddleware: false,
  },
  disableLogger: true,
  widenClientFileUpload: false,
};

// Skip Sentry webpack wrapping on CI/Northflank builds (BUILD_SCOPE=1) — withSentryConfig
// spawns a child process that doubles peak heap and can OOM the builder.
// Sentry still initialises at runtime via instrumentation.ts.
const skipSentry =
  process.env.BUILD_SCOPE === '1';

export default skipSentry
  ? nextConfig
  : withSentryConfig(nextConfig, sentryWebpackPluginOptions);
