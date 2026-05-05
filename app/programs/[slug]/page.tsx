import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { programs as staticPrograms } from '@/content/cf-programs';

export const revalidate = 3600;

export async function generateStaticParams() {
  const db = await getAdminClient();
  if (db) {
    const { data } = await db
      .from('programs')
      .select('slug')
      .eq('is_active', true)
      .neq('status', 'archived');
    if (data && data.length > 0) return data.map((p) => ({ slug: p.slug }));
  }
  return staticPrograms.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const db = await getAdminClient();
  if (db) {
    const { data } = await db
      .from('programs')
      .select('title, description, short_description')
      .eq('slug', slug)
      .maybeSingle();
    if (data) return {
      title: `${data.title} | Elevate for Humanity`,
      description: data.short_description || data.description || '',
    };
  }
  const p = staticPrograms.find((p) => p.slug === slug);
  if (!p) return {};
  return { title: `${p.title} | Elevate for Humanity`, description: p.summary };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Try Supabase first
  const db = await getAdminClient();
  if (db) {
    const { data: p } = await db
      .from('programs')
      .select('slug, title, description, short_description, credential, duration_weeks, image_url')
      .eq('slug', slug)
      .maybeSingle();

    if (p) {
      return (
        <section className="mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-3xl font-bold text-slate-900">{p.title}</h1>
          {p.short_description && (
            <p className="mt-4 text-lg text-slate-700">{p.short_description}</p>
          )}
          {p.description && (
            <div className="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">
              {p.description}
            </div>
          )}
          <div className="mt-10 flex gap-4">
            <Link
              href={`/apply?program=${p.slug}`}
              className="rounded bg-brand-red-600 px-6 py-3 text-white font-semibold hover:bg-brand-red-700"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="rounded border px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50"
            >
              All Programs
            </Link>
          </div>
        </section>
      );
    }
  }

  // Fall back to static content
  const p = staticPrograms.find((p) => p.slug === slug);
  if (!p) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">{p.title}</h1>
      <p className="mt-4 text-lg text-slate-700">{p.description}</p>
      <div className="mt-8 space-y-6">
        {p.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-semibold text-slate-900">{section.heading}</h2>
            <p className="mt-2 text-slate-700">{section.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <a
          href={p.ctaHref}
          className="rounded bg-brand-red-600 px-5 py-3 text-white font-semibold hover:bg-brand-red-700"
        >
          {p.ctaLabel}
        </a>
      </div>
    </section>
  );
}
