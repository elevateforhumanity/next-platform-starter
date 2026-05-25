/**
 * lib/course-builder/program-resolver.ts
 *
 * DB-backed replacement for the hardcoded PROGRAM_COURSE_MAP in schema.ts.
 *
 * Resolves program_slug → course_id from the program_course_map table.
 * Falls back to the legacy static map during the migration window so existing
 * code paths continue to work before the migration is applied.
 *
 * Usage:
 *   import { resolveCourseIdFromDb } from '@/lib/course-builder/program-resolver';
 *   const courseId = await resolveCourseIdFromDb(db, 'hvac-technician');
 *
 * Admin registration (new programs, no code deploy required):
 *   import { registerProgramCourse } from '@/lib/course-builder/program-resolver';
 *   await registerProgramCourse(db, 'peer-recovery-specialist', courseId);
 */

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ── Legacy fallback (removed once migration is confirmed live) ────────────────
// These match the values that were hardcoded in schema.ts.
const LEGACY_FALLBACK: Record<string, string> = {
  'hvac-technician': 'f0593164-55be-5867-98e7-8a86770a8dd0',
  'barber-apprenticeship': '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
};

// ── DB resolver ───────────────────────────────────────────────────────────────

/**
 * Resolves a program slug to its canonical course_id.
 * Queries program_course_map first; falls back to the legacy static map
 * if the table doesn't exist yet (pre-migration environments).
 *
 * Returns null if the slug is not registered anywhere.
 */
export async function resolveCourseIdFromDb(
  db: SupabaseClient,
  programSlug: string,
): Promise<string | null> {
  // Try program_course_links first (canonical, org-scoped).
  const { data: linkData, error: linkError } = await db
    .from('program_course_links')
    .select('course_id')
    .eq('program_slug', programSlug)
    .eq('status', 'active')
    .eq('is_primary', true)
    .maybeSingle();

  if (!linkError && linkData?.course_id) return linkData.course_id;

  // Fall back to program_course_map (legacy, pre-migration).
  const { data, error } = await db
    .from('program_course_map')
    .select('course_id')
    .eq('program_slug', programSlug)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      logger.warn('[program-resolver] program_course_map table not found — using legacy fallback', {
        programSlug,
      });
      return LEGACY_FALLBACK[programSlug] ?? null;
    }
    logger.error('[program-resolver] DB error resolving program slug', undefined, {
      programSlug,
      error: error.message,
    });
    return LEGACY_FALLBACK[programSlug] ?? null;
  }

  if (data?.course_id) return data.course_id;

  const legacy = LEGACY_FALLBACK[programSlug] ?? null;
  if (legacy) {
    logger.warn('[program-resolver] slug not in DB, using legacy fallback', { programSlug });
  }
  return legacy;
}

/**
 * Lists all registered program → course mappings.
 * Used by the admin UI to show what programs are registered.
 */
export async function listProgramCourseMappings(
  db: SupabaseClient,
): Promise<Array<{ program_slug: string; course_id: string; created_at: string }>> {
  const { data, error } = await db
    .from('program_course_map')
    .select('program_slug, course_id, created_at')
    .order('program_slug');

  if (error) {
    logger.error('[program-resolver] failed to list mappings', undefined, { error: error.message });
    // Return legacy entries as fallback so the UI is never empty.
    return Object.entries(LEGACY_FALLBACK).map(([program_slug, course_id]) => ({
      program_slug,
      course_id,
      created_at: new Date(0).toISOString(),
    }));
  }

  return data ?? [];
}

/**
 * Registers a new program → course mapping.
 * Idempotent: updates course_id if the slug already exists.
 *
 * Call this from the admin UI when creating a new program,
 * instead of editing schema.ts.
 */
export async function registerProgramCourse(
  db: SupabaseClient,
  programSlug: string,
  courseId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db
    .from('program_course_map')
    .upsert({ program_slug: programSlug, course_id: courseId }, { onConflict: 'program_slug' });

  if (error) {
    logger.error('[program-resolver] failed to register mapping', undefined, {
      programSlug,
      courseId,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }

  logger.info('[program-resolver] registered program → course', { programSlug, courseId });
  return { ok: true };
}

/**
 * Removes a program → course mapping.
 * Does not delete the course or program — only the link.
 */
export async function unregisterProgramCourse(
  db: SupabaseClient,
  programSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from('program_course_map').delete().eq('program_slug', programSlug);

  if (error) {
    logger.error('[program-resolver] failed to unregister mapping', undefined, {
      programSlug,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
