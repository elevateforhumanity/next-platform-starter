import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_ECS_SECRET_KEYS } from '@/lib/admin/required-ecs-secrets';

const REPO_ROOT = join(__dirname, '../..');

describe('dev container credential wiring (no fake secrets in UI)', () => {
  it('ecs-task-admin.json lists every canonical admin secret from SSM', () => {
    const taskDef = JSON.parse(
      readFileSync(join(REPO_ROOT, 'aws/ecs-task-admin.json'), 'utf8'),
    ) as {
      containerDefinitions: Array<{ secrets?: Array<{ name: string }> }>;
    };
    const fromFile = new Set(
      (taskDef.containerDefinitions[0]?.secrets ?? []).map((s) => s.name),
    );
    for (const key of ADMIN_ECS_SECRET_KEYS) {
      expect(fromFile.has(key), `missing secret in ecs-task-admin.json: ${key}`).toBe(true);
    }
  });

  it('command center components do not embed raw API keys or placeholder Supabase secrets', () => {
    const paths = [
      'components/admin/dashboard/AdminCommandWorkbench.tsx',
      'components/admin/dashboard/CommandCenterWorkspace.tsx',
      'components/admin/dashboard/PlatformTerminalPanel.tsx',
      'components/admin/dashboard/DevContainerPanel.tsx',
      'components/dev-studio/DevContainerPanel.tsx',
      'components/dev-studio/SecretsPanel.tsx',
    ];
    const banned = [
      /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]+['"]/,
      /sk_live_[a-zA-Z0-9]+/,
      /sk_test_[a-zA-Z0-9]+/,
      /eyJhbGci[a-zA-Z0-9._-]{20,}/,
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder/,
    ];
    for (const rel of paths) {
      let src: string;
      try {
        src = readFileSync(join(REPO_ROOT, rel), 'utf8');
      } catch {
        continue;
      }
      for (const pattern of banned) {
        expect(src, `${rel} must not contain hardcoded secrets`).not.toMatch(pattern);
      }
    }
  });

  it('DevContainerPanel staging preset uses real template URLs not literal ${...} strings', () => {
    const src = readFileSync(
      join(REPO_ROOT, 'components/dev-studio/DevContainerPanel.tsx'),
      'utf8',
    );
    expect(src).not.toContain("'https://staging.${PLATFORM_DEFAULTS.canonicalDomain}'");
    expect(src).not.toContain("'https://admin.${PLATFORM_DEFAULTS.canonicalDomain}'");
  });

  it('devcontainer setup pulls credentials from SSM path /elevate/', () => {
    const setup = readFileSync(join(REPO_ROOT, '.devcontainer/setup-env.sh'), 'utf8');
    expect(setup).toContain('SSM_PATH="/elevate/"');
    expect(setup).toContain('AWS_ACCESS_KEY_ID');
    expect(setup).not.toContain('FAKE_');
  });
});
