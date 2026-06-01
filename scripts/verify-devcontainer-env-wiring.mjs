#!/usr/bin/env node
/**
 * Verifies dev container / ECS env wiring — no fake credentials in UI paths.
 * Run: node scripts/verify-devcontainer-env-wiring.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function fail(msg) {
  console.error(`❌ ${msg}`);
  failed += 1;
}
function ok(msg) {
  console.log(`✅ ${msg}`);
}

const taskPath = join(root, 'aws/ecs-task-admin.json');
const task = JSON.parse(readFileSync(taskPath, 'utf8'));
const secrets = task.containerDefinitions[0]?.secrets ?? [];
const env = task.containerDefinitions[0]?.environment ?? [];

if (secrets.length < 20) {
  fail(`ecs-task-admin.json has only ${secrets.length} SSM secrets (expected 20+)`);
} else {
  ok(`Admin ECS task: ${secrets.length} secrets from SSM, ${env.length} plain env vars`);
}

for (const s of secrets) {
  if (!s.valueFrom?.includes('parameter/elevate/')) {
    fail(`Secret ${s.name} is not sourced from /elevate/ SSM: ${s.valueFrom}`);
  }
}

const devPanel = readFileSync(join(root, 'components/dev-studio/DevContainerPanel.tsx'), 'utf8');
if (devPanel.includes("'https://staging.${PLATFORM_DEFAULTS")) {
  fail('DevContainerPanel staging preset still has broken literal ${...} URLs');
} else {
  ok('DevContainerPanel staging preset uses real template literals');
}

const setup = readFileSync(join(root, '.devcontainer/setup-env.sh'), 'utf8');
if (!setup.includes('SSM_PATH="/elevate/"')) {
  fail('setup-env.sh does not pull from /elevate/ SSM');
} else {
  ok('devcontainer setup-env.sh pulls from AWS SSM /elevate/*');
}

const uiPaths = [
  'components/admin/dashboard/LizzyContainer.tsx',
  'components/admin/dashboard/LizzyWorkspace.tsx',
  'components/dev-studio/DevContainerPanel.tsx',
  'components/dev-studio/SecretsPanel.tsx',
];
const banned = [/sk_live_[a-zA-Z0-9]+/, /sk_test_[a-zA-Z0-9]+/, /eyJhbGci[a-zA-Z0-9._-]{30,}/];
for (const rel of uiPaths) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const src = readFileSync(p, 'utf8');
  for (const re of banned) {
    if (re.test(src)) fail(`${rel} contains a hardcoded credential pattern`);
  }
}

if (failed === 0) {
  console.log('\nAll devcontainer env wiring checks passed.');
  process.exit(0);
} else {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
