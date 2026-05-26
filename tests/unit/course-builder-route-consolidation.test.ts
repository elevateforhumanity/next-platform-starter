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

  it('legacy builder pages still exist for backward compat but link to studio', () => {
    expect(existsSync(path.join(root, 'apps/admin/app/admin/course-builder/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/course-builder/CourseBuilderPageClient.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/courses/ai-builder/AICourseBuilderChat.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/courses/ai-builder/page.tsx'))).toBe(false);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/course-builder/PageClient.tsx'))).toBe(false);
    expect(existsSync(path.join(root, 'apps/admin/app/admin/programs/builder/ProgramBuilderClient.tsx'))).toBe(false);
    expect(existsSync(path.join(root, 'app/lms/(app)/builder/page.tsx'))).toBe(false);
    expect(existsSync(path.join(root, 'components/lms/CourseAuthoringTool.tsx'))).toBe(false);
    expect(existsSync(path.join(root, 'components/lms/CourseAuthoringTool-placeholder.tsx'))).toBe(false);
  });

  it('nav and program pages link to /admin/studio, not old routes', () => {
    expect(read('apps/admin/app/admin/programs/page.tsx')).toContain('href="/admin/studio"');
    expect(read('apps/admin/app/admin/programs/page.tsx')).not.toContain('href="/admin/course-builder"');
    expect(read('apps/admin/app/admin/programs/page.tsx')).not.toContain('href="/admin/curriculum"');
  });

  it('does not rely on legacy builder redirects or route metadata', () => {
    expect(read('proxy.ts')).not.toContain('/admin/programs/builder');
    expect(read('lib/auth/lms-routes.ts')).not.toContain('/lms/builder');
    expect(read('config/site-map.auto.ts')).not.toContain('/lms/builder');
    expect(read('config/navigation.ts')).not.toContain('/admin/courses/ai-builder');
    expect(read('apps/admin/app/admin/courses/page.tsx')).not.toContain('/admin/courses/ai-builder');
    expect(read('apps/admin/app/admin/curriculum/page.tsx')).not.toContain('/admin/courses/ai-builder');
    expect(read('scripts/check-enterprise-features.ts')).toContain(
      'apps/admin/app/admin/course-builder/CourseBuilderPageClient.tsx',
    );
  });

  it('ai-builder chat component links to studio after save', () => {
    const chat = read('apps/admin/app/admin/courses/ai-builder/AICourseBuilderChat.tsx');
    expect(chat).toContain('/admin/studio');
    expect(chat).not.toContain('/admin/course-builder/');
  });

  it('uses fast standards-aware generation from the canonical builder', () => {
    const pageClient = read('apps/admin/app/admin/course-builder/CourseBuilderPageClient.tsx');
    const route = read('apps/admin/app/api/admin/course-builder/generate-from-blueprint/route.ts');

    expect(pageClient).toContain("generationMode: 'fast'");
    expect(pageClient).toContain("videoMode: 'queue'");
    expect(pageClient).toContain('Generate Standard Credentialed Course');
    expect(route).toContain('loadIndustryStandards(blueprint.socCode, blueprint.credentialCode)');
    expect(route).toContain("if (generationMode === 'fast')");
    expect(route).toContain('buildFallbackLessonContent(lesson, mod.title, courseTitle, standardsBlock)');
    expect(route).not.toContain("blueprint.socCode && generationMode !== 'fast'");
  });

  it('embeds the AI prompt builder in the canonical builder surface', () => {
    const pageClient = read('apps/admin/app/admin/course-builder/CourseBuilderPageClient.tsx');
    const chat = read('apps/admin/app/admin/courses/ai-builder/AICourseBuilderChat.tsx');

    expect(pageClient).toContain('AICourseBuilderChat');
    expect(pageClient).toContain("type BuilderMode = 'ai-prompt' | 'standard'");
    expect(pageClient).toContain('Prompt Builder');
    expect(pageClient).toContain('embedded');
    expect(chat).toContain('embedded?: boolean');
  });
});

