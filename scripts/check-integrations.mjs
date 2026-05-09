#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';

function readText(path) {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function check(name, ok, detail = '') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${name}${detail ? `: ${detail}` : ''}`);
}

const packageJson = JSON.parse(readText('package.json') || '{}');
const scripts = packageJson.scripts || {};
const envText = readText('.env') + '\n' + readText('.env.local');
const wrangler = readText('wrangler.toml') || readText('cloudflare-workers/wrangler.toml');

const buildConfigured = typeof scripts.build === 'string' && scripts.build.length > 0;
const supabaseConfigured =
  /NEXT_PUBLIC_SUPABASE_URL=/.test(envText) &&
  /NEXT_PUBLIC_SUPABASE_ANON_KEY=/.test(envText) &&
  /SUPABASE_SERVICE_ROLE_KEY=/.test(envText);
const awsConfigured =
  existsSync('aws/ecs-task-lms.json') &&
  existsSync('aws/ecs-task-admin.json') &&
  existsSync('Dockerfile.package') &&
  (
    existsSync('.github/workflows/deploy-aws.yml') ||
    (existsSync('.github/workflows/deploy-lms.yml') && existsSync('.github/workflows/deploy-admin.yml'))
  );
const cloudflareConfigured =
  (existsSync('wrangler.toml') || existsSync('cloudflare-workers/wrangler.toml')) &&
  /name\s*=\s*/.test(wrangler) &&
  (/account_id\s*=\s*/.test(wrangler) || /CLOUDFLARE_ACCOUNT_ID=/.test(envText));

console.log('Integration Audit Summary');
console.log('=========================');
check('Build script', buildConfigured, buildConfigured ? 'configured' : 'missing');
check('Supabase envs', supabaseConfigured, supabaseConfigured ? 'configured' : 'incomplete');
check('AWS ECS deploy', awsConfigured, awsConfigured ? 'configured' : 'incomplete');
check(
  'Cloudflare worker config',
  cloudflareConfigured,
  cloudflareConfigured ? 'configured' : 'incomplete',
);

const allOk = buildConfigured && supabaseConfigured && awsConfigured && cloudflareConfigured;
console.log('');
check('Overall integration readiness', allOk, allOk ? 'PASS' : 'ACTION NEEDED');
process.exit(allOk ? 0 : 1);
