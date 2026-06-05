import {
  PRESTIGE_ELEVATION_BARBER_CURRICULUM,
  PRESTIGE_ELEVATION_BARBER_CURRICULUM_SHORT,
  PRESTIGE_ELEVATION_BARBER_WORKBOOK_HREF,
} from '@/lib/barber/branding';
import { BARBER_COURSE_ID } from '@/lib/barber/pricing';

/** Programs with a dedicated enrollment document upload flow under /programs/[slug]/documents */
const PROGRAM_DOCUMENT_UPLOAD_SLUGS = new Set([
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
]);

/** Self-pay programs — never show WorkOne / WIOA intake checklist */
export const WORKONE_INELIGIBLE_PROGRAM_SLUGS = new Set(['barber-apprenticeship']);

const SELF_PAY_FUNDING_TYPES = new Set([
  'self-pay',
  'self-pay-full',
  'self-pay-plan',
  'self_pay',
]);

/** Canonical LMS course IDs for apprenticeship RTI (Elevate-hosted online coursework) */
export const APPRENTICESHIP_LMS_COURSE_IDS: Record<string, string> = {
  'barber-apprenticeship': BARBER_COURSE_ID,
};

const APPRENTICESHIP_RTI_LABELS: Record<string, { full: string; short: string }> = {
  'barber-apprenticeship': {
    full: PRESTIGE_ELEVATION_BARBER_CURRICULUM,
    short: PRESTIGE_ELEVATION_BARBER_CURRICULUM_SHORT,
  },
};

const APPRENTICESHIP_WORKBOOK_HREFS: Record<string, string> = {
  'barber-apprenticeship': PRESTIGE_ELEVATION_BARBER_WORKBOOK_HREF,
};

export function apprenticeshipOrientationPath(programSlug: string): string {
  return `/programs/${programSlug}/orientation`;
}

export function apprenticeshipDocumentsPath(programSlug: string): string {
  if (PROGRAM_DOCUMENT_UPLOAD_SLUGS.has(programSlug)) {
    return `/programs/${programSlug}/documents`;
  }
  return '/apprentice/documents';
}

export function apprenticeshipLmsCoursePath(programSlug: string): string | null {
  const courseId = APPRENTICESHIP_LMS_COURSE_IDS[programSlug];
  return courseId ? `/lms/courses/${courseId}` : null;
}

export function apprenticeshipRtiLabel(programSlug: string, short = false): string | null {
  const labels = APPRENTICESHIP_RTI_LABELS[programSlug];
  if (!labels) return null;
  return short ? labels.short : labels.full;
}

export function apprenticeshipWorkbookHref(programSlug: string): string | null {
  return APPRENTICESHIP_WORKBOOK_HREFS[programSlug] ?? null;
}

export function isWorkoneChecklistEligibleApplication(app: {
  program_slug?: string | null;
  funding_type?: string | null;
}): boolean {
  const slug = app.program_slug ?? '';
  if (WORKONE_INELIGIBLE_PROGRAM_SLUGS.has(slug)) return false;
  const funding = (app.funding_type ?? '').toLowerCase();
  if (SELF_PAY_FUNDING_TYPES.has(funding)) return false;
  return true;
}
