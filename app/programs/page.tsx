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
  // Healthcare
  'cna', 'qma', 'medical-assistant', 'peer-recovery-specialist', 'direct-support-professional',
  'drug-alcohol-specimen-collector', 'cpr-first-aid', 'pharmacy-technician', 'phlebotomy',
  'home-health-aide', 'sanitation-infection-control', 'dental-assistant', 'chw-cert',
  'nha-pharmacy-technician', 'nha-ehr', 'nha-patient-care-technician', 'nha-medical-admin-assistant',
  'nha-medical-assistant', 'nha-billing-coding', 'nha-phlebotomy', 'nha-ekg-technician',
  // Trades
  'hvac-technician', 'electrical', 'plumbing', 'cdl-training', 'welding',
  'building-services-technician', 'building-maintenance-wrg', 'solar-panel-installation',
  'manufacturing-technician', 'diesel-mechanic', 'automotive-technician',
  'construction-trades-certification', 'forklift',
  // Apprenticeships
  'barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship',
  'nail-technician-apprenticeship', 'culinary-apprenticeship', 'youth-culinary-apprenticeship',
  'emt-apprenticeship',
  // Business
  'finance-bookkeeping-accounting', 'bookkeeping', 'tax-preparation', 'entrepreneurship',
  'business-startup', 'business-administration', 'real-estate-agent', 'insurance-agent',
  'administrative-assistant', 'customer-service-representative', 'office-administration',
  'project-management',
  // Technology
  'it-help-desk', 'software-development', 'web-development', 'data-analytics',
  'cybersecurity-analyst', 'network-administration', 'network-support-technician',
  'cad-drafting', 'graphic-design',
  // Special
  'jri', 'reentry-specialist', 'life-coach-certification-wioa', 'nrf-riseup',
  // Hospitality
  'start-hospitality', 'guest-service-gold', 'servsuccess', 'servsafe-food-handler', 'servsafe-manager',
  // Beauty
  'esthetician',
  // Category landing pages
  'healthcare', 'skilled-trades', 'technology',
]);

/** Slugs that are near-duplicates of a canonical — suppress from listing. */
const SUPPRESSED_SLUGS = new Set([
  // CNA duplicates → canonical: cna
  'cna-certification',
  'cna-cert',
  'cna-training',
  // HVAC duplicates → canonical: hvac-technician
  'hvac',
  'hvac-technician-program',
  'hvac-2024',
  // Medical assistant duplicates → canonical: medical-assistant
  'medical-assistant-program',
  'nha-medical-assistant',
  // Phlebotomy duplicates → canonical: phlebotomy
  'phlebotomy-technician',
  'phlebotomy-technician-program',
  'nha-phlebotomy',
  // Pharmacy duplicates → canonical: pharmacy-technician
  'nha-pharmacy-technician',
  // Barber duplicates → canonical: barber-apprenticeship
  'barber',
  'barber-program',
  // Cosmetology duplicates → canonical: cosmetology-apprenticeship
  'cosmetology',
  // Nail tech duplicates → canonical: nail-technician-apprenticeship
  'nail-technician',
  // CPR duplicates → canonical: cpr-first-aid
  'cpr-cert',
  // Emergency health duplicates → canonical: emergency-health-safety
  'health-safety',
  // Forklift duplicates → canonical: forklift
  'forklift-operator',
  // Tax prep duplicates → canonical: tax-preparation
  'tax-prep',
  // IT duplicates → canonical: it-help-desk
  'it-support',
  'it-support-specialist',
  // Cybersecurity duplicates → canonical: cybersecurity-analyst
  'cybersecurity',
  // Bookkeeping duplicates → canonical: bookkeeping
  'bookkeeping-fundamentals',
  // Entrepreneurship duplicates → canonical: entrepreneurship
  'entrepreneurship-small-business',
  // Peer recovery duplicates → canonical: peer-recovery-specialist
  'peer-recovery-specialist-jri',
  // AI-generated slugs (seeder artifacts)
  'ai-advanced-project-management-1774494313718',
  'ai-forklift-safety-certification-1774495387731',
  // JRI micro-badges — not standalone programs
  'jri-badge-1-mindsets',
  'jri-badge-2-self-management',
  'jri-badge-3-learning-strategies',
  'jri-badge-4-social-skills',
  'jri-badge-5-workplace-skills',
  'jri-badge-6-launch-a-career',
  'jri-introduction',
  // Category/partner pages, not programs
  'jri',
  'micro-programs',
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
        .map((p) => {
          let desc: string | null = p.short_description || p.description || null;
          // Guard against DB values truncated mid-sentence: if the description
          // doesn't end with terminal punctuation, trim to the last complete sentence.
          if (desc && !/[.!?]$/.test(desc.trim())) {
            const lastPeriod = Math.max(desc.lastIndexOf('.'), desc.lastIndexOf('!'), desc.lastIndexOf('?'));
            desc = lastPeriod > 20 ? desc.slice(0, lastPeriod + 1) : null;
          }
          return { slug: p.slug, title: p.title, description: desc };
        });
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
