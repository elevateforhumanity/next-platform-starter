import Link from 'next/link';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { programs as staticPrograms } from '@/content/cf-programs';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Programs | Elevate for Humanity',
  description:
    'Credential-bearing programs in healthcare, skilled trades, technology, beauty, and business. WIOA and Workforce Ready Grant funding available.',
};

export default async function ProgramsPage() {
  const db = createPublicClient();
  let programs: { slug: string; title: string; description: string | null }[] = [];

  // Alias slugs that have dedicated redirect pages — exclude from catalog
  const ALIAS_SLUGS = new Set([
    'barber', 'cdl', 'cna-certification', 'certified-nursing-assistant',
    'cpr-first-aid-hsi', 'cybersecurity', 'hvac', 'it-support',
    'professional-esthetician', 'tax-prep-financial-services',
  ]);

  if (db) {
    const { data } = await db
      .from('programs')
      .select('slug, title, short_description, description')
      .eq('is_active', true)
      .neq('status', 'archived')
      .order('title');
    if (data && data.length > 0) {
      // Deduplicate: exclude known alias slugs, then deduplicate by normalized title
      const seenTitles = new Set<string>();
      programs = data
        .filter((p) => !ALIAS_SLUGS.has(p.slug))
        .filter((p) => {
          const key = p.title.toLowerCase().trim();
          if (seenTitles.has(key)) return false;
          seenTitles.add(key);
          return true;
        })
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.short_description || p.description || null,
        }));
    }
  }

  if (programs.length === 0) {
    // Static fallback — also deduplicated by title
    const seenTitles = new Set<string>();
    programs = staticPrograms
      .filter((p) => !ALIAS_SLUGS.has(p.slug))
      .filter((p) => {
        const key = p.title.toLowerCase().trim();
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      })
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.summary,
      }));
  }

  return (
    <>
      <HeroVideo
        videoSrcDesktop={heroBanners['programs'].videoSrcDesktop}
        posterImage={heroBanners['programs'].posterImage}
        voiceoverSrc={heroBanners['programs'].voiceoverSrc}
        microLabel={heroBanners['programs'].microLabel}
        belowHeroHeadline={heroBanners['programs'].belowHeroHeadline}
        belowHeroSubheadline={heroBanners['programs'].belowHeroSubheadline}
        ctas={[
          heroBanners['programs'].primaryCta,
          ...(heroBanners['programs'].secondaryCta ? [heroBanners['programs'].secondaryCta] : []),
        ]}
        trustIndicators={heroBanners['programs'].trustIndicators}
        transcript={heroBanners['programs'].transcript}
        analyticsName={heroBanners['programs'].analyticsName}
      />
      <section className="mx-auto max-w-6xl px-4 py-16">
        {/* Catalog filter entry point */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Training Programs</h2>
            <p className="text-sm text-slate-500 mt-1">
              Healthcare, skilled trades, technology, business, and more.
            </p>
          </div>
          <Link
            href="/programs/catalog"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shrink-0"
          >
            Filter &amp; Search All Programs →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {programs.map((program) => (
            <article
              key={program.slug}
              className="rounded-xl border border-slate-200 p-6 hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-lg font-bold text-slate-900">{program.title}</h2>
              {program.description && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">
                  {program.description}
                </p>
              )}
              <Link
                href={`/programs/${program.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-brand-red-600 hover:text-brand-red-700 hover:underline"
              >
                View program →
              </Link>
            </article>
          ))}
        </div>

        {/* Bottom catalog CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-3">Looking for something specific?</p>
          <Link
            href="/programs/catalog"
            className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 hover:border-brand-red-500 hover:text-brand-red-600 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Browse Full Program Catalog with Filters
          </Link>
        </div>
      </section>
    </>
  );
}
