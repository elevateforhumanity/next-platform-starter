#!/usr/bin/env node
/**
 * Validate public Next.js build env without echoing values into Docker logs.
 *
 * Docker build output expands shell variables in RUN commands on some builders.
 * Keeping validation in Node lets us fail fast without printing Supabase URLs or
 * anon keys in the build command/history. NEXT_PUBLIC_* values are still public
 * client configuration, but they must come from Northflank build env/secrets.
 */

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

function isPlaceholder(value) {
  return /^(changeme|change_me|placeholder|your_|example|todo|undefined|null)$/i.test(value.trim());
}

function validateUrl(name, value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      return `${name} must be an https:// URL`;
    }
    if (!parsed.hostname.endsWith('.supabase.co')) {
      return `${name} must point to a Supabase project URL`;
    }
    return undefined;
  } catch {
    return `${name} must be a valid URL`;
  }
}

function validateJwtLike(name, value) {
  const parts = value.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length < 8)) {
    return `${name} must look like a Supabase anon JWT`;
  }
  return undefined;
}

const errors = [];

for (const name of required) {
  const value = process.env[name];
  if (!value || isPlaceholder(value)) {
    errors.push(`${name} is required at Docker build time`);
  }
}

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const error = validateUrl('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (error) errors.push(error);
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const error = validateJwtLike(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (error) errors.push(error);
}

if (errors.length > 0) {
  console.error('Missing or invalid public Supabase build configuration:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error(
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as Northflank build-time env/build args. Values are intentionally not echoed.',
  );
  process.exit(1);
}

console.info('Public Supabase build env validated (values redacted).');
