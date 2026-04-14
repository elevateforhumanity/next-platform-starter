import { notFound } from 'next/navigation';
import { legalDocs } from '@/content/legal';
import { findBySlug, staticParamsFromSlugs } from '@/lib/content-helpers';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export function generateStaticParams() {
  return staticParamsFromSlugs(legalDocs);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = findBySlug(legalDocs, slug);
  if (!doc) return {};
  return buildMetadata({
    title: doc.title,
    description: doc.summary,
    path: `/legal/${slug}`,
  });
}

export default async function LegalDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = findBySlug(legalDocs, slug);
  if (!doc) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{doc.title}</h1>
      <p className="mt-4 text-gray-600">{doc.summary}</p>

      <div className="mt-8 rounded border bg-gray-50 p-6">
        <p className="text-sm text-gray-600">
          For the full text of this document, contact us at{' '}
          <a href={`mailto:${siteConfig.email}`} className="underline">
            {siteConfig.email}
          </a>{' '}
          or call{' '}
          <a href={`tel:${siteConfig.phone}`} className="underline">
            {siteConfig.phone}
          </a>.
        </p>
      </div>
    </section>
  );
}
