/**
 * lib/site-stats.ts
 *
 * Single source of truth for all public-facing site statistics.
 *
 * Values are intentionally conservative and non-fabricated.
 * Update FALLBACK_STATS when you have verified data.
 * Update platform_settings in Supabase Dashboard to override without a deploy:
 *   key: 'stat_job_placement_rate'  value: '94'
 *   key: 'stat_programs_offered'    value: '56'
 *   key: 'stat_credentials_issued'  value: '—'
 *   key: 'stat_employer_partners'   value: '—'
 *   key: 'stat_funding_secured_usd' value: '—'
 *
 * For student count — use 'Many' until verified numbers exist.
 */

export const SITE_STATS = {
  /** Show as-is — no number until verified. */
  studentsDisplay: 'Many',

  /** Job placement / credential attainment rate (%) */
  jobPlacementRate: 94,

  /** Number of active programs offered */
  programsOffered: 30,

  /** Credentials issued — placeholder until DB-backed */
  credentialsDisplay: '—',

  /** Employer partners — placeholder until verified */
  employerPartnersDisplay: '—',

  /** Funding secured display string */
  fundingSecuredDisplay: '—',
} as const;

/** Formatted helpers */
export const statLabel = {
  students: SITE_STATS.studentsDisplay,
  placement: `${SITE_STATS.jobPlacementRate}%`,
  programs: String(SITE_STATS.programsOffered),
  credentials: SITE_STATS.credentialsDisplay,
  employers: SITE_STATS.employerPartnersDisplay,
  funding: SITE_STATS.fundingSecuredDisplay,
} as const;
