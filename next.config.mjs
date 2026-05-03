import { withSentryConfig } from '@sentry/nextjs';
import fs from 'node:fs';
import path from 'node:path';

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
  // Railway needs standalone for the persistent Node server.
  // Netlify MUST NOT use standalone — Next.js ENOENT on route-group
  // client-reference-manifest files (lms/(public)/page_client-reference-manifest.js).
  // Guard: NETLIFY=true (set in netlify.toml [build.environment]) OR
  // NETLIFY_BUILD_BASE (injected by Netlify CI before config evaluation).
  ...((process.env.NETLIFY === 'true' || process.env.NETLIFY_BUILD_BASE) ? {} : { output: 'standalone' }),
  // edge-tts ships index.ts as its entry point (uncompiled TypeScript).
  // Netlify/webpack build: transpilePackages compiles it so webpack can parse it.
  // Railway build uses next.config.railway.mjs where edge-tts is in
  // serverExternalPackages instead — a package cannot be in both arrays under Turbopack.
  transpilePackages: ['edge-tts'],

  // turbopack: {} removed — enabling it causes OOM kills on Netlify's build
  // containers (exit 137). Production builds use webpack. Dev uses --turbopack
  // via the dev script.

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
    qualities: [85, 90, 95],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
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
  allowedDevOrigins: ['localhost', '**.gitpod.dev'],

  // Experimental features for better performance
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '**.gitpod.dev',
        'www.elevateforhumanity.org',
        'elevateforhumanity.org',
      ],
    },
    // optimizePackageImports is disabled globally.
    // On Netlify (1,400+ pages) it adds significant webpack compilation overhead
    // and was confirmed active in build logs despite the NETLIFY env-var guard
    // (the var may not be set when next.config.mjs is first evaluated).
    // Re-enable per-package only after moving to a host with >8 GB build RAM.
    // Disabled: spawns separate child processes, exceeds Netlify build RAM.
    optimizeCss: false,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
    // webpackBuildWorker: disabled.
    // When true, Next.js spawns a child worker with isolatedMemory: false,
    // meaning the child inherits the full NODE_OPTIONS heap (7168 MB).
    // Main process + worker = up to 14 GB on an 8 GB Netlify container → SIGKILL.
    // Running webpack in-process keeps peak RSS within the single 7168 MB budget.
    // deferredEntries + onBeforeDeferredEntries already handle GC between passes.
    webpackBuildWorker: false,

    // deferredEntries: removed — OOM is now controlled via single worker +
    // 4GB heap. Two-pass compilation added complexity without enough benefit.
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
      };
    }

    // Limit parallelism to 1 on all builds — this is a 2,670-file app and
    // webpack holds all in-flight module graphs in memory simultaneously.
    // 2 workers doubles peak heap; 1 worker keeps it manageable.
    config.parallelism = 1;

    // Note: config.cache is intentionally not set here.
    // Next.js overwrites any custom cache config with its own filesystem cache
    // pointing to .next/cache/webpack/. Setting it here is a no-op.

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
    // Exclude heavy/dev files from ALL routes to reduce Netlify handler size
    '*': [
      // Generated media — served by CDN, not the server function
      'public/generated/**',
      'public/generated-images/**',
      // Dev artifacts
      'reports/**',
      'audit-packet/**',
      'playwright-report/**',
      // Browser automation
      '**/node_modules/playwright/**',
      '**/node_modules/puppeteer/**',
      '**/node_modules/@playwright/**',
      '**/node_modules/playwright-core/**',
      '**/node_modules/puppeteer-core/**',
      '**/node_modules/**/chromium/**',
      '**/node_modules/@sparticuz/**',
      '**/node_modules/chrome-aws-lambda/**',
      // Dev-only tools
      '**/node_modules/typescript/**',
      '**/node_modules/jsdom/**',
      '**/node_modules/core-js/**',
      // Sharp native binaries
      '**/node_modules/@img/sharp-libvips-*/**',
      '**/node_modules/@img/sharp-linux-*/**',
      '**/node_modules/@img/sharp-darwin-*/**',
      '**/node_modules/@img/sharp-win32-*/**',
      // Heavy PDF dist bundles
      '**/node_modules/jspdf/dist/**',
      '**/node_modules/pdf-lib/**',
      '**/node_modules/.pnpm/pdf-lib*/**',
      // @apm-js-collab is a hard runtime require() of @sentry/node-core — must NOT be excluded
      // Remotion + TTS + FFmpeg — Railway-only, never needed on Netlify SSR
      '**/node_modules/@remotion/**',
      '**/node_modules/.pnpm/@remotion*/**',
      '**/node_modules/remotion/**',
      '**/node_modules/.pnpm/remotion*/**',
      '**/node_modules/edge-tts/**',
      '**/node_modules/.pnpm/edge-tts*/**',
      '**/node_modules/ffmpeg-static/**',
      '**/node_modules/.pnpm/ffmpeg-static*/**',
      '**/node_modules/@ffmpeg/**',
      '**/node_modules/.pnpm/@ffmpeg*/**',
      // Remotion source compositions — only used by Remotion CLI renderer
      'remotion-src/**',
      // rspack — Turbopack/webpack build tool, never needed at runtime
      '**/node_modules/@rspack/**',
      '**/node_modules/.pnpm/@rspack*/**',
      // Monaco editor — browser-only code editor, never runs server-side
      '**/node_modules/monaco-editor/**',
      '**/node_modules/.pnpm/monaco-editor*/**',
      '**/node_modules/@monaco-editor/**',
      '**/node_modules/.pnpm/@monaco-editor*/**',
      // node-pty — terminal emulator, browser/desktop only
      '**/node_modules/node-pty/**',
      '**/node_modules/.pnpm/node-pty*/**',
      // lucide-react — icon library, client components only (42MB)
      '**/node_modules/lucide-react/**',
      '**/node_modules/.pnpm/lucide-react*/**',
      // three.js — 3D library, browser-only (38MB + 29MB stdlib)
      '**/node_modules/three/**',
      '**/node_modules/.pnpm/three*/**',
      '**/node_modules/three-stdlib/**',
      '**/node_modules/.pnpm/three-stdlib*/**',
      '**/node_modules/@react-three/**',
      '**/node_modules/.pnpm/@react-three*/**',
      '**/node_modules/@dimforge/**',
      '**/node_modules/.pnpm/@dimforge*/**',
      // jspdf — full package (not just dist/) — client-side PDF generation
      '**/node_modules/jspdf/**',
      '**/node_modules/.pnpm/jspdf*/**',
      // pdfjs-dist — browser PDF renderer (28MB)
      '**/node_modules/pdfjs-dist/**',
      '**/node_modules/.pnpm/pdfjs-dist*/**',
      // hls.js — browser HLS video player (24MB)
      '**/node_modules/hls.js/**',
      '**/node_modules/.pnpm/hls.js*/**',
      // canvas — native Node canvas binding, not needed in Lambda
      '**/node_modules/canvas/**',
      '**/node_modules/.pnpm/canvas*/**',
      '**/node_modules/@napi-rs/**',
      '**/node_modules/.pnpm/@napi-rs*/**',
      // @mediapipe — ML vision library, browser/native only (20MB)
      '**/node_modules/@mediapipe/**',
      '**/node_modules/.pnpm/@mediapipe*/**',
      // video.js — browser video player (19MB)
      '**/node_modules/video.js/**',
      '**/node_modules/.pnpm/video.js*/**',
      '**/node_modules/@videojs/**',
      '**/node_modules/.pnpm/@videojs*/**',
      // pdf-parse — heavy PDF text extractor (19MB)
      '**/node_modules/pdf-parse/**',
      '**/node_modules/.pnpm/pdf-parse*/**',
      // @sentry/cli — Sentry release CLI binary, build-time only (21MB)
      '**/node_modules/@sentry/cli/**',
      '**/node_modules/.pnpm/@sentry+cli*/**',
      // prettier — code formatter, build-time only (19MB)
      '**/node_modules/prettier/**',
      '**/node_modules/.pnpm/prettier*/**',
      // es-toolkit — utility library, tree-shaken at build time (9.5MB)
      '**/node_modules/es-toolkit/**',
      '**/node_modules/.pnpm/es-toolkit*/**',
      // recharts — charting library, client components only (7.6MB)
      '**/node_modules/recharts/**',
      '**/node_modules/.pnpm/recharts*/**',
      // mediabunny — media processing, not needed in SSR (6.8MB)
      '**/node_modules/mediabunny/**',
      '**/node_modules/.pnpm/mediabunny*/**',
      // pdfkit — server PDF generation but heavy (5.9MB) — use API route instead
      '**/node_modules/pdfkit/**',
      '**/node_modules/.pnpm/pdfkit*/**',
      // fontkit / hyphen — PDF font/hyphenation libs pulled in by pdfkit (5.8MB each)
      '**/node_modules/fontkit/**',
      '**/node_modules/.pnpm/fontkit*/**',
      '**/node_modules/hyphen/**',
      '**/node_modules/.pnpm/hyphen*/**',
      // web-streams-polyfill — polyfill not needed in modern Node (8.8MB)
      '**/node_modules/web-streams-polyfill/**',
      '**/node_modules/.pnpm/web-streams-polyfill*/**',
      // @swc/core — SWC compiler, build-time only (28MB)
      '**/node_modules/@swc/core/**',
      '**/node_modules/.pnpm/@swc+core*/**',
      // happy-dom — test DOM, never needed at runtime (18MB)
      '**/node_modules/happy-dom/**',
      '**/node_modules/.pnpm/happy-dom*/**',
      // Source files not needed at runtime
      'app/**/*.tsx',
      'app/**/*.ts',
      'components/**/*.tsx',
      'components/**/*.ts',
      'lib/**/*.ts',
      'lib/**/*.tsx',
    ],
  },

  // Redirects for consolidated routes
  async redirects() {
    const canonicalRoutesPath = path.join(process.cwd(), 'lib/routes/canonical-routes.json');
    const canonicalConfig = JSON.parse(fs.readFileSync(canonicalRoutesPath, 'utf8'));
    const canonicalAliasRedirects = (canonicalConfig.legacyAliases || []).map((alias) => ({
      source: alias.source,
      destination: alias.destination,
      permanent: alias.permanent !== false,
    }));

    return [
      // ============================================
      // DELETED PAGE REDIRECTS
      // ============================================
      {
        source: '/programs/technology/it-support',
        destination: '/programs/it-help-desk',
        permanent: true,
      },
      {
        source: '/programs/technology/cybersecurity',
        destination: '/programs/cybersecurity-analyst',
        permanent: true,
      },

      // ============================================
      // OLD URL ALIASES → CORRECT EXISTING PAGES
      // ============================================
      { source: '/for-students', destination: '/student-portal', permanent: true },
      { source: '/forgotpassword', destination: '/reset-password', permanent: true },
      { source: '/resetpassword', destination: '/reset-password', permanent: true },
      { source: '/verifyemail', destination: '/verify-email', permanent: true },
      { source: '/lms/messages/new', destination: '/lms/messages', permanent: true },
      { source: '/lms/messages/support/new', destination: '/lms/messages', permanent: true },
      // building-maintenance-tech → building-services-technician (correct page)
      { source: '/programs/building-maintenance-tech', destination: '/programs/building-services-technician', permanent: true },
      // finance-bookkeeping-accounting → bookkeeping (canonical page)
      { source: '/programs/business-financial', destination: '/programs/bookkeeping', permanent: true },
      { source: '/programs/finance-bookkeeping-accounting', destination: '/programs/bookkeeping', permanent: true },
      // cpr-first-aid HAS its own page — no redirect needed (removed incorrect redirect)
      // cpr-first-aid-hsi redirect lives in netlify.toml — do not duplicate here
      // direct-support-professional HAS its own page — no redirect needed
      // drug-collector HAS its own page — no redirect needed
      // esthetician-apprenticeship HAS its own page — no redirect needed
      {
        source: '/programs/professional-esthetician',
        destination: '/programs/esthetician-apprenticeship',
        permanent: true,
      },
      // forklift now has its own detail page — redirect removed
      { source: '/programs/it-support', destination: '/programs/it-help-desk', permanent: true },
      // /programs/jri → /partners/jri (JRI is a funding partner page, not a program)
      { source: '/programs/jri', destination: '/partners/jri', permanent: true },
      // phlebotomy HAS its own page — redirect to it, not generic /healthcare
      { source: '/programs/phlebotomy-technician', destination: '/programs/phlebotomy', permanent: true },
      {
        source: '/programs/business-startup-marketing',
        destination: '/programs/entrepreneurship',
        permanent: true,
      },
      {
        source: '/programs/emergency-health-safety-tech',
        destination: '/programs/emergency-health-safety',
        permanent: true,
      },
      {
        source: '/programs/public-safety-reentry-specialist',
        destination: '/programs/peer-recovery-specialist',
        permanent: true,
      },
      { source: '/programs/cdl-class-a', destination: '/programs/cdl-training', permanent: true },
      {
        source: '/programs/medical-coding-billing',
        destination: '/programs/healthcare',
        permanent: true,
      },
      {
        source: '/programs/cosmetology',
        destination: '/programs/cosmetology-apprenticeship',
        permanent: true,
      },

      // ============================================
      // APP ALIAS REDIRECTS (Rule B: auth/app path renames)
      // Centralized here instead of scattered in-page redirect() calls.
      // proxy.ts handles auth; these are pure path consolidation.
      // ============================================

      // /admin/* — all admin routes are Railway-owned.
      // Netlify edge (netlify.toml) force-redirects /admin and /admin/* to /login.
      // Internal /admin/* → /admin/* path consolidation is handled by Railway's next.config.

      // Apprentice
      { source: '/apprentice/dashboard', destination: '/apprentice', permanent: true },
      { source: '/apprentice/progress', destination: '/apprentice/hours', permanent: true },

      // Dashboard
      { source: '/dashboard/sub-offices/new', destination: '/dashboard', permanent: true },

      // Employer
      { source: '/employer/apprenticeship', destination: '/employer', permanent: true },
      { source: '/employer/apprenticeship/new', destination: '/employer', permanent: true },
      { source: '/employer/applications', destination: '/employer', permanent: true },
      { source: '/employer/apprentices/new', destination: '/employer', permanent: true },
      { source: '/employer/login', destination: '/login', permanent: true },
      { source: '/employer/postings/new', destination: '/employer', permanent: true },
      { source: '/employer/register', destination: '/apply/employer', permanent: true },

      // LMS
      { source: '/lms/catalog', destination: '/lms/courses', permanent: true },

      // Mentor / Mentorship
      { source: '/mentor', destination: '/mentor/dashboard', permanent: false },
      { source: '/mentor/apply', destination: '/mentorship', permanent: true },
      { source: '/mentorship/apply', destination: '/apply', permanent: true },

      // Partner (app-side) - skip /partner-with-us and /partners intermediaries
      { source: '/partner/refer', destination: '/platform/partners', permanent: true },

      // Portal — exact match before wildcard
      {
        source: '/portal/staff/dashboard',
        destination: '/staff-portal/dashboard',
        permanent: true,
      },

      // Program holder
      {
        source: '/program-holder/portal',
        destination: '/program-holder/dashboard',
        permanent: true,
      },
      {
        source: '/program-holder/portal/attendance',
        destination: '/program-holder/dashboard',
        permanent: true,
      },
      {
        source: '/program-holder/portal/live-qa',
        destination: '/program-holder/support',
        permanent: true,
      },
      {
        source: '/program-holder/portal/messages',
        destination: '/program-holder/support',
        permanent: true,
      },
      {
        source: '/program-holder/portal/reports',
        destination: '/program-holder/reports',
        permanent: true,
      },
      {
        source: '/program-holder/portal/students',
        destination: '/program-holder/students',
        permanent: true,
      },
      {
        source: '/program-holder/programs/new',
        destination: '/program-holder/programs',
        permanent: true,
      },

      // Staff
      {
        source: '/staff-portal/processes',
        destination: '/staff-portal/qa-checklist',
        permanent: true,
      },

      // Student portal
      { source: '/student-portal/messages', destination: '/lms/chat', permanent: true },
      { source: '/student-portal/settings', destination: '/lms/settings', permanent: true },
      { source: '/student/support', destination: '/contact', permanent: false },

      // Governance / compliance aliases
      {
        source: '/governance/operational-controls',
        destination: '/legal/governance/platform-overview',
        permanent: true,
      },
      {
        source: '/governance/compliance',
        destination: '/legal/governance/platform-overview',
        permanent: true,
      },
      { source: '/community', destination: '/help', permanent: false },
      { source: '/financial-aid', destination: '/funding', permanent: true },
      { source: '/workforce-board/reports', destination: '/workone-partner-packet', permanent: true },
      {
        source: '/admin/accreditation/evidence/new',
        destination: '/admin/accreditation',
        permanent: true,
      },
      { source: '/admin/blog/new', destination: '/admin/blog', permanent: true },
      { source: '/admin/course-studio', destination: '/admin/course-templates', permanent: true },
      { source: '/admin/users/invite', destination: '/admin/staff', permanent: true },
      {
        source: '/admin/wioa/documents/upload',
        destination: '/admin/wioa/documents',
        permanent: true,
      },

      // ============================================
      // LEGACY / FRAMEWORK REDIRECTS
      // ============================================

      // Normalize "Institute" style routes into the infrastructure model
      { source: '/institute', destination: '/', permanent: true },
      { source: '/training-institute', destination: '/programs', permanent: true },
      { source: '/student/dashboard', destination: '/student-portal', permanent: true },

      // Fix old hero image paths
      {
        source: '/clear-pathways-hero.jpg',
        destination: '/clear-path-main-image.jpg',
        permanent: true,
      },
      {
        source: '/images/efh/hero/hero-main.jpg',
        destination: '/images/efh/hero/hero-main-clean.jpg',
        permanent: true,
      },
      // /client-portal → /learner/dashboard (SaaS portal page removed)
      {
        source: '/client-portal/:path*',
        destination: '/learner/dashboard',
        permanent: true,
      },
      // /sitemap → /site-map (HTML sitemap page moved to avoid conflict with app/sitemap.ts)
      {
        source: '/sitemap',
        destination: '/site-map',
        permanent: true,
      },
      // Redirect sitemap-page to sitemap.xml
      {
        source: '/sitemap-page',
        destination: '/sitemap.xml',
        permanent: true,
      },
      // /home → / handled by Netlify (public SEO route, Rule A)

      // /student, /student/:path*, /learner, /learner/:path*, /lms/:path* →
      // handled by Netlify edge (netlify.toml [[redirects]] → /login). Removed here to avoid conflict.
      // Exact match first: /portal → portal chooser. Wildcard below catches /portal/anything → /lms/anything.
      { source: '/portal', destination: '/portals', permanent: true },
      { source: '/portal/:path*', destination: '/lms/:path*', permanent: true },
      { source: '/students/:path*', destination: '/lms/:path*', permanent: true },
      { source: '/learners/:path*', destination: '/lms/:path*', permanent: true },
      {
        source: '/program-holder-portal/:path*',
        destination: '/program-holder/:path*',
        permanent: true,
      },
      // Legacy pluralized Program Holder URLs → canonical singular routes
      { source: '/program-holders', destination: '/program-holder', permanent: true },
      {
        source: '/program-holders/portal',
        destination: '/program-holder/dashboard',
        permanent: true,
      },
      {
        source: '/program-holders/universal-mou',
        destination: '/legal/program-holder-mou',
        permanent: true,
      },
      {
        source: '/program-holders/sign-mou',
        destination: '/program-holder/sign-mou',
        permanent: true,
      },
      { source: '/program-holders/apply', destination: '/apply/program-holder', permanent: true },
      {
        source: '/program-holders/onboarding',
        destination: '/program-holder/onboarding',
        permanent: true,
      },
      {
        source: '/program-holders/training-providers',
        destination: '/program-holder',
        permanent: true,
      },
      {
        source: '/program-holders/acknowledgement',
        destination: '/program-holder/rights-responsibilities',
        permanent: true,
      },
      { source: '/program-holders/:path*', destination: '/program-holder/:path*', permanent: true },
      // /admin-portal is now a public landing page - no redirect needed
      // /dashboard redirect removed - handled by middleware with auth check

      // Tax consolidation
      { source: '/tax-filing/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/tax-services/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/tax-software/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/supersonic-fast-cash/:path*', destination: '/tax', permanent: false },

      // Program consolidation
      { source: '/programs-catalog/:path*', destination: '/programs/:path*', permanent: true },
      { source: '/program-finder/:path*', destination: '/programs/:path*', permanent: true },
      { source: '/compare-programs/:path*', destination: '/programs/:path*', permanent: true },

      // Program alias → DB canonical slug (one URL per program)
      // Archived year-specific variants
      {
        source: '/programs/barber-2024',
        destination: '/programs/barber-apprenticeship',
        permanent: true,
      },
      { source: '/programs/hvac-2024', destination: '/programs/hvac-technician', permanent: true },
      // CDL
      { source: '/programs/cdl', destination: '/programs/cdl-training', permanent: true },
      {
        source: '/programs/cdl-transportation',
        destination: '/programs/cdl-training',
        permanent: true,
      },
      // CNA duplicates → canonical /programs/cna
      { source: '/programs/cna-certification', destination: '/programs/cna', permanent: true },
      { source: '/programs/certified-nursing-assistant', destination: '/programs/cna', permanent: true },
      { source: '/programs/cna-training', destination: '/programs/cna', permanent: true },
      // HVAC duplicates → canonical /programs/hvac-technician
      { source: '/programs/hvac', destination: '/programs/hvac-technician', permanent: true },
      // Cybersecurity duplicate → canonical /programs/cybersecurity-analyst
      { source: '/programs/cybersecurity', destination: '/programs/cybersecurity-analyst', permanent: true },
      // Barber & Beauty
      {
        source: '/programs/barber',
        destination: '/programs/barber-apprenticeship',
        permanent: true,
      },
      {
        source: '/programs/beauty',
        destination: '/programs/barber-apprenticeship',
        permanent: true,
      },
      // Business
      // Tax programs — no tax page in this repo; send to contact
      { source: '/programs/tax-preparation', destination: '/contact', permanent: false },
      { source: '/programs/tax-prep', destination: '/contact', permanent: false },
      {
        source: '/programs/tax-entrepreneurship',
        destination: '/programs/entrepreneurship',
        permanent: true,
      },
      {
        source: '/programs/tax-prep-financial-services',
        destination: '/programs/tax-preparation',
        permanent: true,
      },
      // Healthcare aliases
      // Human Services
      // Skilled Trades aliases
      // Technology aliases
      {
        source: '/programs/cybersecurity',
        destination: '/programs/cybersecurity-analyst',
        permanent: true,
      },

      // Career consolidation — /career-center handled by Netlify (Rule A)
      { source: '/career-fair/:path*', destination: '/career-services/:path*', permanent: true },

      // Partner consolidation — /partner-with-us handled by Netlify (Rule A)
      { source: '/partner-application/:path*', destination: '/partners/:path*', permanent: true },

      // apply/barber — dedicated partner application flow (was a redirect-only page.tsx, moved here)
      {
        source: '/apply/barber',
        destination: '/partners/barbershop-apprenticeship/apply',
        permanent: true,
      },

      // Partner onboarding flows — auth-gated Railway pages.
      // Unauthenticated hits get sent to login; Railway serves the page post-auth.
      {
        source: '/partners/barbershop-apprenticeship/forms',
        destination: '/login?redirect=/partners/barbershop-apprenticeship/forms',
        permanent: false,
      },
      {
        source: '/partners/barbershop-apprenticeship/handbook',
        destination: '/login?redirect=/partners/barbershop-apprenticeship/handbook',
        permanent: false,
      },
      {
        source: '/partners/barbershop-apprenticeship/sign-mou',
        destination: '/login?redirect=/partners/barbershop-apprenticeship/sign-mou',
        permanent: false,
      },
      {
        source: '/partners/barbershop-apprenticeship/policy-acknowledgment',
        destination: '/login?redirect=/partners/barbershop-apprenticeship/policy-acknowledgment',
        permanent: false,
      },
      {
        source: '/partners/cosmetology-apprenticeship/forms',
        destination: '/login?redirect=/partners/cosmetology-apprenticeship/forms',
        permanent: false,
      },
      {
        source: '/partners/cosmetology-apprenticeship/handbook',
        destination: '/login?redirect=/partners/cosmetology-apprenticeship/handbook',
        permanent: false,
      },
      {
        source: '/partners/cosmetology-apprenticeship/sign-mou',
        destination: '/login?redirect=/partners/cosmetology-apprenticeship/sign-mou',
        permanent: false,
      },
      {
        source: '/partners/cosmetology-apprenticeship/policy-acknowledgment',
        destination: '/login?redirect=/partners/cosmetology-apprenticeship/policy-acknowledgment',
        permanent: false,
      },
      { source: '/partner-courses/:path*', destination: '/partners/:path*', permanent: true },
      { source: '/partner-playbook/:path*', destination: '/partners/:path*', permanent: true },

      // Auth consolidation
      { source: '/reset-password', destination: '/login', permanent: false },

      // Missing public pages — redirect to closest marketing equivalent
      { source: '/apply/student', destination: '/apply', permanent: false },
      { source: '/apply/program-holder', destination: '/apply', permanent: false },
      { source: '/apply/employer', destination: '/employers', permanent: false },
      { source: '/for-employers', destination: '/employers', permanent: true },
      { source: '/for-agencies', destination: '/contact', permanent: false },
      { source: '/partnerships', destination: '/partners', permanent: true },
      { source: '/program-holder', destination: '/apply', permanent: false },
      {
        source: '/program-holder/:path*',
        destination: '/login?redirect=/program-holder/:path*',
        permanent: false,
      },
      { source: '/cna-waitlist', destination: '/programs', permanent: false },
      { source: '/credentials/checksheets', destination: '/programs', permanent: false },
      {
        source: '/credentials/hvac-standards',
        destination: '/programs/hvac-technician',
        permanent: false,
      },
      { source: '/credentials/:path*', destination: '/programs', permanent: false },
      { source: '/careers', destination: '/contact', permanent: false },
      { source: '/donate', destination: '/contact', permanent: false },
      { source: '/philanthropy', destination: '/contact', permanent: false },
      // /tuition-fees → /tuition handled in netlify.toml (301, force)
      { source: '/faq', destination: '/support', permanent: true },
      { source: '/how-it-works', destination: '/about', permanent: false },
      { source: '/mission', destination: '/about', permanent: false },
      { source: '/impact', destination: '/about', permanent: false },
      { source: '/site-map', destination: '/programs', permanent: false },
      { source: '/security-and-data-protection', destination: '/privacy-policy', permanent: false },
      // /consumer-education → /resources handled in netlify.toml (301, force)
      { source: '/equal-opportunity', destination: '/about', permanent: false },
      { source: '/federal-compliance', destination: '/disclosures', permanent: false },
      { source: '/grievance', destination: '/contact', permanent: false },
      { source: '/satisfactory-academic-progress', destination: '/disclosures', permanent: false },
      { source: '/policies/:path*', destination: '/disclosures', permanent: false },
      { source: '/hire-graduates', destination: '/employers', permanent: true },
      // /apprenticeship-sponsor → /partners/training-provider handled in netlify.toml (301, force)
      { source: '/events', destination: '/contact', permanent: false },
      { source: '/schedule', destination: '/contact', permanent: false },
      { source: '/orientation/schedule', destination: '/contact', permanent: false },
      { source: '/onboarding/learner', destination: '/login', permanent: false },
      { source: '/onboarding/:path*', destination: '/login', permanent: false },
      { source: '/funding/dol', destination: '/funding', permanent: false },
      // /funding/federal-programs → /funding handled in netlify.toml (301, force)
      { source: '/funding/jri', destination: '/funding', permanent: false },
      // /funding/state-programs → /funding handled in netlify.toml (301, force)
      // /funding/wrg → /funding handled in netlify.toml (301, force)
      { source: '/jri', destination: '/funding', permanent: false },
      // /partners/jri → /partners handled in netlify.toml (301, force)
      // /partners/reentry → /partners handled in netlify.toml (301, force)
      { source: '/partners/sales', destination: '/partners', permanent: false },
      { source: '/partners/technology', destination: '/partners', permanent: false },
      // /partners/workforce → /partners handled in netlify.toml (301, force)
      { source: '/fssa-partnership-request', destination: '/contact', permanent: false },
      { source: '/pay', destination: '/apply', permanent: false },
      { source: '/enroll', destination: '/apply', permanent: false },
      // NOTE: /enroll/:path* wildcard intentionally omitted here.
      // Specific /enroll/* overrides are declared in the ENROLL/APPLY CONSOLIDATION
      // block below. A wildcard here would shadow those specific rules.
      { source: '/financial-aid', destination: '/funding', permanent: true },
      { source: '/financial-support', destination: '/funding', permanent: true },
      { source: '/community/:path*', destination: '/community-services', permanent: true },
      // /compliance/:path* is Railway-owned (netlify.toml proxy) — no redirect here
      // /supersonic-fast-cash is handled by netlify.toml — do not add redirects here
      { source: '/docs/:path*', destination: '/resources', permanent: false },
      // /workone-partner-packet → /snap-et-partner handled in netlify.toml (301, force)
      // Railway portal redirects — handled by Netlify edge (netlify.toml) for:
      //   /checkout/:path*, /lms/:path*, /learner, /learner/:path*, /student, /student/:path*,
      //   /instructor/:path*, /staff-portal/:path*, /case-manager/:path*, /partner/dashboard, /partner/dashboard/*
      // Remaining next.config-only portal redirects (no netlify.toml equivalent):
      { source: '/dashboard', destination: '/login', permanent: false },
      { source: '/my-dashboard', destination: '/login', permanent: false },
      { source: '/employer', destination: '/employers', permanent: false },
      { source: '/employer/:path*', destination: '/login', permanent: false },
      { source: '/partner/:path*', destination: '/login', permanent: false },
      { source: '/provider/:path*', destination: '/login', permanent: false },
      { source: '/approvals', destination: '/login', permanent: false },
      { source: '/account/:path*', destination: '/login', permanent: false },
      // /admin/:path* — handled by Netlify edge (netlify.toml force redirect). Removed here.
      { source: '/program-holder/:path*', destination: '/login', permanent: false },
      // Missing public pages with no Railway equivalent
      { source: '/cert/verify', destination: '/verify', permanent: true },
      { source: '/certiport-exam', destination: '/testing', permanent: false },
      { source: '/microclasses', destination: '/programs', permanent: false },
      { source: '/outcomes/indiana', destination: '/about', permanent: false },
      { source: '/orientation', destination: '/apply', permanent: false },
      { source: '/help/:path*', destination: '/support', permanent: false },
      { source: '/compliance', destination: '/disclosures', permanent: false },
      { source: '/credentials', destination: '/programs', permanent: false },
      { source: '/schedule', destination: '/contact', permanent: false },

      // Legal consolidation
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/terms', destination: '/terms-of-service', permanent: true },
      { source: '/legal/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/legal/terms-of-service', destination: '/legal/privacy', permanent: true },
      {
        source: '/legal/governance/lms',
        destination: '/legal/governance/lms-standards',
        permanent: true,
      },
      {
        source: '/legal/governance/store',
        destination: '/legal/governance/store-payments',
        permanent: true,
      },
      { source: '/policies/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/policies/terms', destination: '/terms-of-service', permanent: true },
      { source: '/policies/grievance', destination: '/grievance', permanent: true },
      { source: '/license-agreement', destination: '/legal/license-agreement', permanent: true },

      // Pricing / billing consolidation
      { source: '/pricing', destination: '/license/pricing', permanent: true },
      { source: '/billing', destination: '/account/billing', permanent: true },

      // Auth aliases
      { source: '/forgot-password', destination: '/reset-password', permanent: true },
      { source: '/partners/login', destination: '/partner/login', permanent: true },

      // Tax / SupersonicFastCash — these belong in a separate repository.
      // Do not add redirects here that point to /supersonic, /tax, or /supersonic-fast-cash.
      // Those routes are not compiled in this Netlify marketing deploy.

      // Store / platform aliases
      { source: '/store/demo', destination: '/store', permanent: true },
      { source: '/store/orders', destination: '/shop/orders', permanent: true },
      { source: '/platform/licensing', destination: '/licensing-partnerships', permanent: true },
      { source: '/chat', destination: '/support/chat', permanent: true },
      { source: '/certificates/verify', destination: '/cert/verify', permanent: true },

      // Verify consolidation
      { source: '/verifycertificate/:path*', destination: '/verify/:path*', permanent: true },

      // Misc redirects
      { source: '/dashboards/:path*', destination: '/lms/:path*', permanent: true },
      // /portals base route has its own page — only redirect sub-paths
      { source: '/portals/:slug/:path*', destination: '/lms/:slug/:path*', permanent: true },
      { source: '/portals/:slug', destination: '/lms/:slug', permanent: true },

      // These brands have their own pages — only redirect sub-paths, not the root
      // /serene-comfort-care/page.tsx exists and redirects to /partners itself
      // /kingdom-konnect/page.tsx exists with full content
      // /urban-build-crew/page.tsx exists with full content
      // /selfish-inc/page.tsx exists with full content

      // Removed routes - financial-aid has its own page now
      { source: '/forums/:path*', destination: '/blog', permanent: true },
      // /alumni/page.tsx exists (182 lines) — do not redirect away from it
      // { source: '/alumni/:path*', destination: '/about', permanent: true },
      // /board → /admin and /delegate → /admin are Railway-internal; removed from Netlify.
      { source: '/receptionist/:path*', destination: '/staff-portal/:path*', permanent: true },
      { source: '/forum/:path*', destination: '/blog', permanent: true },
      // /news/page.tsx exists (137 lines) — do not redirect away from it
      // { source: '/news/:path*', destination: '/blog/:path*', permanent: true },

      // Old 404 URLs from Google/Netlify logs - redirect to relevant pages
      { source: '/about/founder', destination: '/about/team', permanent: true },
      { source: '/etpl-programs', destination: '/pathways', permanent: true },
      { source: '/intake', destination: '/apply', permanent: true },
      { source: '/home1', destination: '/', permanent: true },
      { source: '/downloads', destination: '/resources', permanent: true },
      { source: '/docs/students/certificates', destination: '/credentials', permanent: true },
      { source: '/programs/food-handler', destination: '/programs', permanent: true },

      // ============================================
      // ENROLL / APPLY CONSOLIDATION
      // Single redirect authority — all enroll/apply routing lives here.
      // Order matters: specific paths must come before the catch-all wildcard.
      // ============================================

      // /enroll → /apply is already declared above (permanent:false, early in the list).
      // The permanent:true duplicate below was dead (first match wins). Removed.

      // Barber enrollment: 1-hop to dedicated apply page (kills 3-hop chain).
      // Must be declared before the /enroll/:path* catch-all below.
      {
        source: '/enroll/barber-apprenticeship',
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },

      // Catch-all for any remaining /enroll/* paths not matched above.
      // Declared after specific overrides so it does not shadow them.
      { source: '/enroll/:path*', destination: '/apply', permanent: true },

      // Duplicate student forms → canonical /apply/student
      // /apply/quick → /apply handled in netlify.toml (301, force)
      { source: '/apply/full', destination: '/apply/student', permanent: true },

      // Duplicate status pages → canonical /apply/track

      // Duplicate success pages → canonical /apply/success
      { source: '/apply/confirmation', destination: '/apply/success', permanent: true },

      // Program holder apply alias (was in netlify.toml)
      { source: '/program-holder/apply', destination: '/apply/program-holder', permanent: true },

      // /scholarships → /funding handled by Netlify (public SEO route, Rule A)
      { source: '/health-services', destination: '/programs/healthcare', permanent: true },
      // Donate page has its own content now
      { source: '/resources/:path*', destination: '/blog', permanent: true },
      {
        source: '/career-uplift-services/:path*',
        destination: '/career-services',
        permanent: true,
      },
      // /community/page.tsx exists (371 lines) — do not redirect away from it
      { source: '/video', destination: '/videos', permanent: true },

      // LMS redirects
      { source: '/lms/my-courses', destination: '/lms/courses', permanent: true },

      // Student portal redirects
      { source: '/student-portal/dashboard', destination: '/student-portal', permanent: true },
      { source: '/student-portal/courses', destination: '/student-portal', permanent: true },
      { source: '/student-portal/certificates', destination: '/student-portal', permanent: true },
      { source: '/student-portal/progress', destination: '/student-portal', permanent: true },
      ...canonicalAliasRedirects,
      // /student-portal/settings → /lms/settings handled by middleware (Rule B)

      // Partner portal redirects
      // NOTE: /partner/dashboard is the canonical partner dashboard page.
      // /partner/page.tsx redirects TO /partner/dashboard, so do NOT redirect /partner/dashboard back.
      // Removed: { source: '/partner/dashboard', destination: '/partner', permanent: true },
      // Removed: { source: '/partner/courses', destination: '/partner', permanent: true },
      // Removed: { source: '/partner/students', destination: '/partner', permanent: true },

      // AI redirects
      { source: '/ai-instructor', destination: '/ai-tutor', permanent: true },

      // Marketing redirects
      { source: '/success-stories', destination: '/testimonials', permanent: true },
      { source: '/for-workforce-boards', destination: '/workforce-board', permanent: true },
      { source: '/get-started', destination: '/start', permanent: true },

      // /admin/* consolidation is Railway-internal — handled there, not here.

      // /outcomes/indiana is a public page — do not redirect it
      // Other outcomes sub-routes redirect to programs until data exists
      { source: '/metrics', destination: '/programs', permanent: false },

      // ============================================
      // DEAD LINK FIXES — public-facing

      // ============================================
      // SEO HUB — PROGRAM PAGE REDIRECTS & HUB ALIAS REDIRECTS
      // ============================================
      { source: '/training/cna', destination: '/programs/cna', permanent: true },
      { source: '/programs/cna-training', destination: '/programs/cna', permanent: true },
      { source: '/training/hvac-technician', destination: '/programs/hvac-technician', permanent: true },
      { source: '/programs/hvac-technician-program', destination: '/programs/hvac-technician', permanent: true },
      { source: '/workforce-training', destination: '/workforce-training-indianapolis', permanent: true },
      { source: '/workforce-training-indiana', destination: '/workforce-training-indianapolis', permanent: true },
      { source: '/wioa-training', destination: '/wioa-funded-training-indiana', permanent: true },
      { source: '/wioa-training-indiana', destination: '/wioa-funded-training-indiana', permanent: true },
      { source: '/wioa-funded-training', destination: '/wioa-funded-training-indiana', permanent: true },
      { source: '/healthcare-training', destination: '/healthcare-training-indianapolis', permanent: true },
      { source: '/skilled-trades-training', destination: '/skilled-trades-training-indiana', permanent: true },
      { source: '/it-certification-training', destination: '/it-certification-training-indianapolis', permanent: true },
      { source: '/employer-workforce-partnerships', destination: '/employer-workforce-partnerships-indiana', permanent: true },
      { source: '/agency-referral-workforce-training', destination: '/agency-referral-workforce-training-indiana', permanent: true },

      // ============================================
      // DEAD LINK FIXES — railway additions
      // ============================================
      { source: '/logout', destination: '/login', permanent: false },
      { source: '/student/support', destination: '/support', permanent: false },
      { source: '/community/groups', destination: '/community', permanent: false },
      { source: '/workforce-board/reports', destination: '/workforce-board', permanent: false },
      { source: '/elevate-platform-overview.pdf', destination: '/resources', permanent: false },
      { source: '/pwa/barber/log-hours', destination: '/programs/barber-apprenticeship', permanent: false },
      { source: '/pwa/barber/training', destination: '/programs/barber-apprenticeship', permanent: false },
      { source: '/pwa/barber/progress', destination: '/programs/barber-apprenticeship', permanent: false },
      { source: '/admin/accreditation/evidence/new', destination: '/admin/accreditation/evidence', permanent: false },
      { source: '/admin/blog/new', destination: '/admin/blog', permanent: false },
      { source: '/admin/users/invite', destination: '/admin/users', permanent: false },
      { source: '/admin/wioa/documents/upload', destination: '/admin/wioa/documents', permanent: false },
      { source: '/admin/live-sessions/new', destination: '/admin/live-sessions', permanent: false },
    ];
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    // Netlify sets CONTEXT (not NODE_ENV) to 'deploy-preview' or 'branch-deploy'
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
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
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
          "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://us06web.zoom.us https://*.sentry.io https://o4504*.ingest.sentry.io https://www.google-analytics.com https://region1.google-analytics.com",
          "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://us06web.zoom.us https://challenges.cloudflare.com https://*.cloudflarestream.com",
          "media-src 'self' data: blob: https://*.supabase.co https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io https://*.r2.dev https://cdn.elevatelms.com https://*.cloudflarestream.com",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://js.stripe.com",
          "frame-ancestors 'none'",
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
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      // 1) Never allow HTML / app routes to be cached for a year
      {
        source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|studio).*)',
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
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },

      // 3) Next image optimizer - short cache with revalidation
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },

      // 4) Safety: prevent accidental long-caching of direct CSS/JS files at root
      {
        source: '/:path*.css',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/:path*.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },

      // Override X-Robots-Tag for images and videos
      {
        source: '/images/:path*',
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

// On Netlify, skip withSentryConfig entirely — it wraps webpack even when
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

export default process.env.NETLIFY === 'true'
  ? nextConfig
  : withSentryConfig(nextConfig, sentryWebpackPluginOptions);
