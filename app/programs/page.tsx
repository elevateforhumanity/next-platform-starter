import Link from 'next/link';
import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { programs as staticPrograms } from '@/content/cf-programs';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Programs | Elevate for Humanity',
  description:
    'Credential-bearing programs in healthcare, skilled trades, technology, beauty, and business. WIOA and Workforce Ready Grant funding available.',
};

/**
 * Canonical slug per program family.
 * Near-duplicate slugs (legacy names, alternate titles) are suppressed from
 * the public listing. The canonical page still exists and is reachable via
 * direct URL or redirect — it just does not appear as a separate card here.
 */
const CANONICAL_SLUGS = new Set([
  'barber-apprenticeship',
  'hvac-technician',
  'cna',
  'medical-assistant',
  'phlebotomy',
  'peer-recovery-specialist',
  'drug-collector',
  'qma',
  'direct-support-professional',
  'welding',
  'plumbing',
  'electrical',
  'cdl-training',
  'building-services-technician',
  'cosmetology-apprenticeship',
  'esthetician',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship',
  'finance-bookkeeping-accounting',
  'tax-preparation',
  'it-help-desk',
  'cybersecurity-analyst',
  'healthcare',
  'skilled-trades',
  'technology',
]);

/** Slugs that are near-duplicates of a canonical — suppress from listing. */
const SUPPRESSED_SLUGS = new Set([
  'cna-certification',
  'cna-training',
  'hvac',
  'hvac-technician-program',
  'medical-assistant-program',
  'phlebotomy-technician',
  'phlebotomy-technician-program',
  'barber',
  'barber-program',
  'jri',           // partner page, not a program
  'micro-programs', // category, not a program
]);

export default async function ProgramsPage() {
  const db = await getAdminClient();
  let programs: { slug: string; title: string; description: string | null }[] = [];

  if (db) {
    const { data } = await db
      .from('programs')
      .select('slug, title, short_description, description')
      .eq('is_active', true)
      .neq('status', 'archived')
      .order('title');

    if (data && data.length > 0) {
      programs = data
        .filter((p) => !SUPPRESSED_SLUGS.has(p.slug))
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.short_description || p.description || null,
        }));
    }
  }

  // Static fallback — already canonical, no dedup needed
  if (programs.length === 0) {
    programs = staticPrograms.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.summary,
    }));
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Programs</h1>
      <p className="mt-4 text-slate-700">
        Credential-bearing programs in healthcare, skilled trades, technology, beauty, and business.
        Most programs complete in 4–12 weeks. WIOA and Workforce Ready Grant funding available for
        eligible Indiana residents.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {programs.map((program) => (
          <article key={program.slug} className="rounded border p-6 hover:bg-slate-50">
            <h2 className="text-xl font-semibold text-slate-900">{program.title}</h2>
            {program.description && (
              <p className="mt-2 text-sm text-slate-700">{program.description}</p>
            )}
            <Link
              href={`/programs/${program.slug}`}
              className="mt-4 inline-block text-sm font-medium text-brand-red-600 underline hover:text-brand-red-700"
            >
              View program
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
