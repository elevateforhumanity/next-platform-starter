export const APPRENTICESHIP = {
  IN: {
    enabled: true,
    state: 'Indiana',
    sponsorName: '2Exclusive LLC-S (DBA Elevate for Humanity Career & Technical Institute)',
    system: 'U.S. Department of Labor Registered Apprenticeship (RAPIDS)',
    programName: 'Barber Apprenticeship',
    earnAndLearn: true,
    registrationNumber: process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || '',
    notes:
      'Indiana Registered Apprenticeship program. Earn while you learn. Classroom instruction provided through approved curriculum partners.',
  },
} as const;

export type ApprenticeshipState = keyof typeof APPRENTICESHIP;

export const APPRENTICESHIP_REQUIRED_HOURS: Record<string, number> = {
  'barber-apprenticeship': 2000,
  'cosmetology-apprenticeship': 2000,
  'esthetician-apprenticeship': 700,
  'nail-tech-apprenticeship': 450,
  'nail-technician-apprenticeship': 450,
};

export function getApprenticeshipRequiredHours(programSlug: string | null | undefined) {
  if (!programSlug) return null;
  return APPRENTICESHIP_REQUIRED_HOURS[programSlug] ?? null;
}
