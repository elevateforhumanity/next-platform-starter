/**
 * Per-program apprenticeship home URLs.
 * Used by login, learner dashboard, and portal router — keep in sync.
 */

import { APPRENTICESHIP_PORTAL_ENROLLMENT_STATES } from '@/lib/enrollment/enrollment-flow';

export const APPRENTICESHIP_SLUG_TO_PORTAL_PATH: Record<string, string> = {
  'barber-apprenticeship': '/apprentice',
  'cosmetology-apprenticeship': '/apprentice',
  'esthetician-apprenticeship': '/apprentice',
  'nail-technician-apprenticeship': '/apprentice',
  'culinary-apprenticeship': '/apprentice',
  electrical: '/apprentice',
  plumbing: '/apprentice',
};

/** program_slug → profiles.portal_type value (see migration 20260526000002) */
export const APPRENTICESHIP_SLUG_TO_PORTAL_TYPE: Record<string, string> = {
  'barber-apprenticeship': 'barber',
  'cosmetology-apprenticeship': 'cosmetology',
  'esthetician-apprenticeship': 'esthetician',
  'nail-technician-apprenticeship': 'nail-technician',
  'culinary-apprenticeship': 'culinary',
  electrical: 'electrical',
  plumbing: 'plumbing',
};

/** @see APPRENTICESHIP_PORTAL_ENROLLMENT_STATES in enrollment-flow.ts */
export const ACTIVE_ENROLLMENT_STATES = APPRENTICESHIP_PORTAL_ENROLLMENT_STATES;

export function portalPathForProgramSlug(programSlug: string | null | undefined): string | null {
  if (!programSlug) return null;
  return APPRENTICESHIP_SLUG_TO_PORTAL_PATH[programSlug] ?? null;
}

export function portalTypeForProgramSlug(programSlug: string | null | undefined): string | null {
  if (!programSlug) return null;
  return APPRENTICESHIP_SLUG_TO_PORTAL_TYPE[programSlug] ?? null;
}

export function isApprenticeshipPortalType(portalType: string | null | undefined): boolean {
  return !!portalType && Object.values(APPRENTICESHIP_SLUG_TO_PORTAL_TYPE).includes(portalType);
}
