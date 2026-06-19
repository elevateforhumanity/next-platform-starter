import { describe, expect, it } from 'vitest';
import { mergePreviewTargets } from '@/lib/admin/merge-preview-targets';

describe('mergePreviewTargets', () => {
  it('prefers config targets and appends unique dashboard targets', () => {
    const merged = mergePreviewTargets(
      [
        { label: 'Public Site', url: 'https://www.elevateforhumanity.org' },
        { label: 'Admin', url: '' },
      ],
      [
        { label: 'Homepage', url: 'https://www.elevateforhumanity.org/' },
        { label: 'Programs', url: 'https://www.elevateforhumanity.org/programs' },
      ],
    );
    expect(merged[0]?.label).toBe('Homepage');
    expect(merged.some((t) => t.label === 'Programs')).toBe(true);
    expect(merged.some((t) => t.label === 'Admin')).toBe(true);
    expect(merged.length).toBe(3);
  });

  it('falls back to dashboard-only when config is empty', () => {
    const dashboard = [{ label: 'LMS', url: 'https://lms.example.com' }];
    expect(mergePreviewTargets(dashboard, undefined)).toEqual(dashboard);
  });
});
