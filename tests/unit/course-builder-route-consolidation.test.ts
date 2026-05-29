import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('studio route consolidation', () => {
  it('studio pages exist at the canonical /admin/studio route', () => {
    expect(existsSync(path.join(root, 'apps/admin/app/admin/studio/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/studio/[courseId]/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'components/studio/StudioShell.tsx'))).toBe(true);
  });

  it('deleted legacy page directories no longer exist', () => {
    expect(existsSync(path.join(root, 'apps/admin/app/admin/course-builder'))).toBe(false);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/video-manager'))).toBe(false);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/ai-console'))).toBe(false);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/ai-studio'))).toBe(false);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/copilot'))).toBe(false);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/applicants'))).toBe(false);
  });

  it('nav and program pages link to /admin/studio, not old routes', () => {
    expect(read('apps/admin/app/admin/programs/page.tsx')).toContain('href="/admin/studio"');
    expect(read('apps/admin/app/admin/programs/page.tsx')).not.toContain('href="/admin/course-builder"');
    expect(read('apps/admin/app/admin/programs/page.tsx')).not.toContain('href="/admin/curriculum"');
  });

  it('programs-table links to /admin/studio not /admin/course-builder', () => {
    const table = read('apps/admin/app/admin/programs/programs-table.tsx');
    expect(table).not.toContain('/admin/course-builder');
    expect(table).toContain('/admin/studio');
  });

  it('does not rely on legacy builder redirects or route metadata', () => {
    expect(read('proxy.ts')).not.toContain('/admin/programs/builder');
    expect(read('lib/auth/lms-routes.ts')).not.toContain('/lms/builder');
  });

  it('ai-builder chat component links to studio after save', () => {
    const chat = read('apps/admin/app/admin/courses/ai-builder/AICourseBuilderChat.tsx');
    expect(chat).toContain('/admin/studio');
    expect(chat).not.toContain('/admin/course-builder/');
  });

  it('course-builder API routes still exist (separate from page routes)', () => {
    expect(existsSync(path.join(root, 'apps/admin/app/api/admin/course-builder'))).toBe(true);
  });
});
