import { describe, expect, it } from 'vitest';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import {
  PROGRAMS_PAGE_SUPPRESSED_SLUGS,
  resolvePublicProgramCount,
} from '@/lib/programs/public-programs-page';

describe('public programs SSR catalog', () => {
  it('static catalog has programs visible on /programs after suppress filter', () => {
    const visible = ALL_PROGRAMS.filter((p) => !PROGRAMS_PAGE_SUPPRESSED_SLUGS.has(p.slug));
    expect(visible.length).toBeGreaterThan(10);
  });

  it('resolvePublicProgramCount uses SITE_STATS floor when count is zero', () => {
    expect(resolvePublicProgramCount(0)).toBeGreaterThan(0);
    expect(resolvePublicProgramCount(42)).toBe(42);
  });
});
