/**
 * Public-facing names for barber RTI (Related Technical Instruction).
 * Do not use third-party curriculum vendor names in learner UI.
 */

import { BARBER_COURSE_ID } from '@/lib/barber/pricing';

export const PRESTIGE_ELEVATION_BARBER_CURRICULUM =
  'Prestige Elevation Barber Curriculum';

/** Short label for nav tabs and compact UI */
export const PRESTIGE_ELEVATION_BARBER_CURRICULUM_SHORT = 'Prestige Elevation Course';

/** Printable / offline companion materials */
export const PRESTIGE_ELEVATION_BARBER_WORKBOOK_LABEL = 'Prestige Elevation Workbook';

/** Canonical LMS path for Prestige Elevation RTI course */
export const prestigeElevationBarberCoursePath = `/lms/courses/${BARBER_COURSE_ID}`;

/** Primary workbook entry — opens Prestige Elevation RTI reading materials in LMS */
export const PRESTIGE_ELEVATION_BARBER_WORKBOOK_HREF =
  `${prestigeElevationBarberCoursePath}?activity=reading`;
