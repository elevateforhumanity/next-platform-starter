#!/usr/bin/env node
/**
 * CI guard: production deploy must be Northflank-only (no AWS ECS workflows).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const workflowDir = '.github/workflows';
const forbidden = [
  /deploy-aws\.yml$/,
  /amazon-ecs/,
  /aws-actions\/configure-aws-credentials/,
  /elevate-cluster/,
  /AWS_ACCESS_KEY_ID.*deploy/i,
];

let failed = false;
for (const file of readdirSync(workflowDir)) {
  if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
  const text = readFileSync(join(workflowDir, file), 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(file) || pattern.test(text)) {
      console.error(`❌ ${file}: matches forbidden AWS deploy pattern ${pattern}`);
      failed = true;
    }
  }
}

const required = [
  '.github/workflows/deploy-lms.yml',
  '.github/workflows/deploy-admin.yml',
  'Dockerfile.northflank-lms',
  'Dockerfile.northflank-admin',
];
for (const path of required) {
  if (!existsSync(path)) {
    console.error(`❌ missing required Northflank artifact: ${path}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('✅ No AWS ECS deploy workflows; Northflank deploy artifacts present.');
