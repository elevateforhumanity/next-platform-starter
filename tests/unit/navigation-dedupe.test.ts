import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, findDuplicateNavHrefs } from '@/lib/navigation';

describe('NAV_ITEMS structure', () => {
  it('has unique top-level ids', () => {
    const ids = NAV_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate leaf hrefs across top-level sections', () => {
    const dupes = findDuplicateNavHrefs();
    if (dupes.length > 0) {
      console.log('Duplicate nav hrefs:', dupes);
    }
    expect(dupes).toEqual([]);
  });

  it('includes core main menu sections', () => {
    const names = NAV_ITEMS.map((i) => i.name);
    expect(names).toContain('Programs');
    expect(names).toContain('Apprenticeships');
    expect(names).toContain('Funding');
    expect(names).toContain('Partners');
    expect(names).toContain('Apply');
    expect(names).toContain('About');
  });
});
