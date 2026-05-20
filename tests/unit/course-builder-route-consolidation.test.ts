import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('course builder route consolidation', () => {
  it('keeps /admin/course-builder as the only live course builder route source', () => {
    expect(existsSync(path.join(root, 'apps/admin/app/admin/course-builder/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/programs/builder/ProgramBuilderClient.tsx'))).toBe(false);
    expect(existsSync(path.join(root, 'app/lms/(app)/builder/page.tsx'))).toBe(false);
    expect(existsSync(path.join(root, 'components/lms/CourseAuthoringTool.tsx'))).toBe(false);
  });

  it('does not rely on legacy builder redirects or route metadata', () => {
    expect(read('proxy.ts')).not.toContain('/admin/programs/builder');
    expect(read('lib/auth/lms-routes.ts')).not.toContain('/lms/builder');
    expect(read('config/site-map.auto.ts')).not.toContain('/lms/builder');
    expect(read('apps/admin/app/admin/programs/page.tsx')).toContain('href="/admin/course-builder"');
  });
});

