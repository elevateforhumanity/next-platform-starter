import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('Apply menu application pages', () => {
  it('pass structural apply-page audit', () => {
    expect(() => {
      execSync('pnpm exec tsx scripts/audit-apply-pages.mjs', {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8',
      });
    }).not.toThrow();
  });
});
