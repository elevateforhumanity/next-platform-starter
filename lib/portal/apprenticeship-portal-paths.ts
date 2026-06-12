/**
 * Per-program apprenticeship home URLs.
 * Used by login, learner dashboard, and portal router — keep in sync.
 */

import { APPRENTICESHIP_PORTAL_ENROLLMENT_STATES } from '@/lib/enrollment/enrollment-flow';

// Canonical program-specific apprentice dashboards. MUST stay in sync with
// SLUG_TO_PORTAL (derived from APPRENTICE_PORTAL_CONFIGS in ApprenticePortalShell)
// and the ApprenticeSubNav "Dashboard" tab. Do not point these at the generic
// /apprentice hub — that creates a parallel dashboard and diverges login routing
// from the rest of the app (see tests/unit/portal-routing.test.ts).
export const APPRENTICESHIP_SLUG_TO_PORTAL_PATH: Record<string, string> = {
  'barber-apprenticeship': '/portal/barber',
  'cosmetology-apprenticeship': '/portal/cosmetology',
  'esthetician-apprenticeship': '/portal/esthetician',
  'nail-technician-apprenticeship': '/portal/nail-technician',
  'culinary-apprenticeship': '/portal/culinary',
  electrical: '/portal/electrical',
  plumbing: '/portal/plumbing',
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
