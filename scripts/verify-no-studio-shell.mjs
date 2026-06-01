#!/usr/bin/env node
/**
 * CI guard: Studio Shell must not be wired into admin ECS or Lizzy UI.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const failures = [];

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}

function mustNotContain(file, patterns) {
  const text = read(file);
  for (const p of patterns) {
    if (text.includes(p)) failures.push(`${file}: must not contain "${p}"`);
  }
}

mustNotContain('aws/ecs-task-admin.json', [
  'STUDIO_SHELL_WS_URL',
  'STUDIO_SHELL_SECRET',
  'STUDIO_SHELL_WS_URL_PUBLIC',
]);
mustNotContain('apps/admin/server.js', ['STUDIO_SHELL_WS_URL', 'attachWsProxy', 'shell-ws']);

if (fs.existsSync(path.join(root, 'studio-shell'))) {
  failures.push('studio-shell/ directory must be deleted');
}
if (fs.existsSync(path.join(root, 'apps/admin/app/admin/dashboard/DevStudioClient.tsx'))) {
  failures.push('apps/admin/app/admin/dashboard/ legacy app must be deleted');
}

const lizzy = read('components/admin/dashboard/LizzyWorkspace.tsx');
if (lizzy.includes('LizzyShellPanel') || lizzy.includes("id: 'shell'")) {
  failures.push('LizzyWorkspace must not reference Shell tab / LizzyShellPanel');
}

if (failures.length) {
  console.error('verify-no-studio-shell FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
console.log('verify-no-studio-shell: OK');
