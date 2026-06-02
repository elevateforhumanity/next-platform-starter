import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('NAV_ITEMS link resolution', () => {
  it('resolves every leaf href to a routable destination', () => {
    expect(() => {
      execSync('pnpm exec tsx scripts/audit-nav-links.mjs', {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8',
      });
    }).not.toThrow();
  });
});
