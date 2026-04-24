/**
 * POST /api/admin/programs/[programId]/clone
 *
 * Deep-clones a program and its full curriculum into a new draft.
 *
 * Clones:
 *   programs (core fields → new slug, title suffixed " (Copy)", status=draft)
 *   program_outcomes
 *   program_credentials
 *   program_modules → program_lessons
 *   program_ctas
 *   program_tracks
 *   course_modules → course_lessons  (the LMS execution layer)
 *   program_course_map entry for the new program slug
 *
 * Does NOT clone:
 *   enrollments, progress, completions, certificates — learner data is never copied
 *   media files — URLs are copied as references, not re-uploaded
 *
 * Body (optional):
 *   { title?: string; slug?: string }
 *   If omitted, title gets " (Copy)" suffix and slug gets "-copy" suffix.
 *
 * Returns: { ok, program: { id, slug, title } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { registerProgramCourse } from '@/lib/course-builder/program-resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const body = await request.json().catch(() => ({}));

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // ── 1. Load source program ────────────────────────────────────────────────

  const { data: src, error: srcErr } = await db
    .from('programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();

  if (srcErr) return safeInternalError(srcErr, 'Failed to load source program');
  if (!src) return safeError('Program not found', 404);

  // ── 2. Resolve new slug + title ───────────────────────────────────────────

  const newTitle = (body.title as string | undefined)?.trim() || `${src.title} (Copy)`;
  const baseSlug = (body.slug as string | undefined)?.trim() || `${src.slug}-copy`;

  // Ensure slug is unique — append -2, -3, etc. if needed.
  let newSlug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing } = await db
      .from('programs')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle();
    if (!existing) break;
    attempt++;
    newSlug = `${baseSlug}-${attempt}`;
  }

  // ── 3. Clone programs row ─────────────────────────────────────────────────

  const { id: _id, created_at: _ca, updated_at: _ua, slug: _slug, title: _title,
          status: _status, published: _pub, ...rest } = src;

  const { data: newProgram, error: progErr } = await db
    .from('programs')
    .insert({
      ...rest,
      title:      newTitle,
      slug:       newSlug,
      status:     'draft',
      published:  false,
      is_active:  false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, slug, title')
    .single();

  if (progErr) return safeInternalError(progErr, 'Failed to create program clone');
  const newProgramId = newProgram.id;

  const errors: string[] = [];

  // ── 4. Clone program_outcomes ─────────────────────────────────────────────

  const { data: outcomes } = await db
    .from('program_outcomes')
    .select('*')
    .eq('program_id', programId)
    .order('outcome_order');

  if (outcomes?.length) {
    const { error } = await db.from('program_outcomes').insert(
      outcomes.map(({ id: _, program_id: __, ...o }) => ({ ...o, program_id: newProgramId })),
    );
    if (error) errors.push(`outcomes: ${error.message}`);
  }

  // ── 5. Clone program_credentials ─────────────────────────────────────────

  const { data: creds } = await db
    .from('program_credentials')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order');

  if (creds?.length) {
    const { error } = await db.from('program_credentials').insert(
      creds.map(({ id: _, program_id: __, ...c }) => ({ ...c, program_id: newProgramId })),
    );
    if (error) errors.push(`credentials: ${error.message}`);
  }

  // ── 6. Clone program_ctas ─────────────────────────────────────────────────

  const { data: ctas } = await db
    .from('program_ctas')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order');

  if (ctas?.length) {
    const { error } = await db.from('program_ctas').insert(
      ctas.map(({ id: _, program_id: __, ...c }) => ({ ...c, program_id: newProgramId })),
    );
    if (error) errors.push(`ctas: ${error.message}`);
  }

  // ── 7. Clone program_tracks ───────────────────────────────────────────────

  const { data: tracks } = await db
    .from('program_tracks')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order');

  if (tracks?.length) {
    const { error } = await db.from('program_tracks').insert(
      tracks.map(({ id: _, program_id: __, ...t }) => ({ ...t, program_id: newProgramId })),
    );
    if (error) errors.push(`tracks: ${error.message}`);
  }

  // ── 8. Clone program_modules + program_lessons ────────────────────────────

  const { data: modules } = await db
    .from('program_modules')
    .select('*, program_lessons(*)')
    .eq('program_id', programId)
    .order('sort_order');

  for (const mod of modules ?? []) {
    const { program_lessons: lessons, id: _mid, program_id: _pid, ...modRest } = mod as any;

    const { data: newMod, error: modErr } = await db
      .from('program_modules')
      .insert({ ...modRest, program_id: newProgramId })
      .select('id')
      .single();

    if (modErr || !newMod) {
      errors.push(`module '${mod.title}': ${modErr?.message}`);
      continue;
    }

    if (lessons?.length) {
      const { error: lessonErr } = await db.from('program_lessons').insert(
        lessons.map(({ id: _, module_id: __, ...l }: any) => ({ ...l, module_id: newMod.id })),
      );
      if (lessonErr) errors.push(`lessons in '${mod.title}': ${lessonErr.message}`);
    }
  }

  // ── 9. Clone LMS execution layer (course_modules + course_lessons) ────────

  // Find the source course via program_course_map or legacy map.
  const { data: srcMapping } = await db
    .from('program_course_map')
    .select('course_id')
    .eq('program_slug', src.slug)
    .maybeSingle();

  if (srcMapping?.course_id) {
    const srcCourseId = srcMapping.course_id;

    // Load source course
    const { data: srcCourse } = await db
      .from('courses')
      .select('*')
      .eq('id', srcCourseId)
      .maybeSingle();

    if (srcCourse) {
      const { id: _cid, created_at: _cca, updated_at: _cua, slug: _cslug, ...courseRest } = srcCourse;

      const { data: newCourse, error: courseErr } = await db
        .from('courses')
        .insert({
          ...courseRest,
          slug:       newSlug,
          status:     'draft',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (courseErr || !newCourse) {
        errors.push(`course clone: ${courseErr?.message}`);
      } else {
        const newCourseId = newCourse.id;

        // Clone course_modules + course_lessons
        const { data: courseMods } = await db
          .from('course_modules')
          .select('*, course_lessons(*)')
          .eq('course_id', srcCourseId)
          .order('order_index');

        for (const cmod of courseMods ?? []) {
          const { course_lessons: clessons, id: _cmid, course_id: _ccid, ...cmodRest } = cmod as any;

          const { data: newCmod, error: cmodErr } = await db
            .from('course_modules')
            .insert({ ...cmodRest, course_id: newCourseId })
            .select('id')
            .single();

          if (cmodErr || !newCmod) {
            errors.push(`course_module '${cmod.title}': ${cmodErr?.message}`);
            continue;
          }

          if (clessons?.length) {
            const { error: clessonErr } = await db.from('course_lessons').insert(
              clessons.map(({ id: _, course_id: __, course_module_id: ___, ...cl }: any) => ({
                ...cl,
                course_id:        newCourseId,
                course_module_id: newCmod.id,
              })),
            );
            if (clessonErr) errors.push(`course_lessons in '${cmod.title}': ${clessonErr.message}`);
          }
        }

        // Register the new program → course mapping
        await registerProgramCourse(db, newSlug, newCourseId);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    program: { id: newProgramId, slug: newSlug, title: newTitle },
    ...(errors.length ? { warnings: errors } : {}),
  });
}
