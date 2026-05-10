import { getAllBlueprints, type CredentialBlueprint } from '@/lib/curriculum/blueprints';
import { buildCanonicalCourseFromBlueprint } from '@/lib/curriculum/builders/buildCanonicalCourseFromBlueprint';
import { requireAdminClient } from '@/lib/supabase/admin';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';

export type ProgramAutoCourseMode = 'replace' | 'missing-only';
export type ProgramAutoCourseVideoMode = 'queue' | 'off';

type ProgramRow = {
  id: string;
  slug: string | null;
  code: string | null;
  credential_type: string | null;
};

function normalize(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function resolveBlueprintForProgram(
  program: ProgramRow,
  blueprints: CredentialBlueprint[],
): CredentialBlueprint | null {
  const slug = normalize(program.slug);
  const code = normalize(program.code);
  const credentialType = normalize(program.credential_type);

  if (slug) {
    const bySlug = blueprints.find((bp) => normalize(bp.programSlug) === slug);
    if (bySlug) return bySlug;
  }

  if (code) {
    const byCode = blueprints.find((bp) => normalize(bp.credentialCode) === code);
    if (byCode) return byCode;
  }

  if (credentialType) {
    const byType = blueprints.find((bp) => normalize(bp.credentialCode) === credentialType);
    if (byType) return byType;
  }

  return null;
}

export async function autoGenerateCourseForProgram(args: {
  programId: string;
  mode?: ProgramAutoCourseMode;
  videoMode?: ProgramAutoCourseVideoMode;
  videoQueueLimit?: number | null;
}) {
  const db = await requireAdminClient();
  const mode = args.mode ?? 'missing-only';
  const videoMode = args.videoMode ?? 'queue';

  const { data: program } = await db
    .from('programs')
    .select('id, slug, code, credential_type')
    .eq('id', args.programId)
    .maybeSingle<ProgramRow>();

  if (!program) {
    return {
      ok: false as const,
      status: 'not_found' as const,
      error: 'Program not found',
    };
  }

  const blueprints = await getAllBlueprints();
  const blueprint = resolveBlueprintForProgram(program, blueprints);
  if (!blueprint) {
    return {
      ok: false as const,
      status: 'no_blueprint' as const,
      error: 'No registered blueprint matches this program',
      programSlug: program.slug,
    };
  }

  const build = await buildCanonicalCourseFromBlueprint({
    blueprint,
    programId: program.id,
    mode,
  });

  let videoQueue = null;
  if (videoMode === 'queue' && build.courseId) {
    videoQueue = await queueCourseLessonVideos({
      courseId: build.courseId,
      onlyMissing: true,
      limit: typeof args.videoQueueLimit === 'number' ? args.videoQueueLimit : null,
    });
  }

  return {
    ok: true as const,
    status: 'generated' as const,
    blueprintId: blueprint.id,
    blueprintProgramSlug: blueprint.programSlug,
    courseId: build.courseId,
    moduleCount: build.moduleCount,
    lessonCount: build.lessonCount,
    warnings: build.warnings,
    videoQueue,
  };
}
