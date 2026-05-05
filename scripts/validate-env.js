#!/usr/bin/env node
/**
 * Pre-deploy env validation. Run in CodeBuild post_build before docker push.
 * Exit 1 = build fails, image never pushed, ECS never updated.
 */

const SERVICE = process.argv[2] || 'lms';

const REQUIRED = {
  lms: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ],
  admin: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_ADMIN_URL',
  ],
};

const required = REQUIRED[SERVICE] ?? REQUIRED.lms;
const missing = required.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error(`[validate-env] FAILED — missing required env vars for ${SERVICE}:`);
  missing.forEach((k) => console.error(`  - ${k}`));
  process.exit(1);
}

console.log(`[validate-env] OK — all required env vars present for ${SERVICE}`);
