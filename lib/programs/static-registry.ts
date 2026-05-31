/**
 * Unified static program registry — single list for marketing, search, and detail pages.
 *
 * Source: every `ProgramSchema` registered in `data/programs/index.ts` (STATIC_PROGRAM_MAP).
 * `data/programs/catalog.ts` re-exports from here for backward compatibility.
 */

import type { ProgramSchema } from '@/lib/programs/program-schema';
import { STATIC_PROGRAM_MAP, getStaticProgram } from '@/data/programs/index';

function buildAllPrograms(): ProgramSchema[] {
  const bySlug = new Map<string, ProgramSchema>();
  for (const program of STATIC_PROGRAM_MAP.values()) {
    bySlug.set(program.slug, program);
  }
  return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title));
}

/** All static programs (deduped by slug). */
export const ALL_PROGRAMS: ProgramSchema[] = buildAllPrograms();

export { getStaticProgram };

export function getProgramBySlug(slug: string): ProgramSchema | undefined {
  return getStaticProgram(slug) ?? ALL_PROGRAMS.find((p) => p.slug === slug);
}

export function getProgramsBySector(sector: string): ProgramSchema[] {
  return ALL_PROGRAMS.filter((p) => p.sector === sector);
}

export const SECTORS = [
  {
    key: 'skilled-trades',
    label: 'Skilled Trades',
    description: 'Hands-on technical training in construction, HVAC, electrical, and welding.',
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    description:
      'Clinical and patient care training leading to nationally recognized certifications.',
  },
  {
    key: 'personal-services',
    label: 'Personal Services',
    description: 'Licensed trade programs in barbering, cosmetology, and personal care.',
  },
  {
    key: 'technology',
    label: 'Technology',
    description: 'IT support, cybersecurity, and software development pathways.',
  },
  {
    key: 'business',
    label: 'Business & Office',
    description: 'Office administration, bookkeeping, and business management.',
  },
] as const;
