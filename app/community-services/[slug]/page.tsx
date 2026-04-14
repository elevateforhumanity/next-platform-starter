import { notFound } from 'next/navigation';
import { communityServices } from '@/content/community-services';
import { findBySlug, staticParamsFromSlugs } from '@/lib/content-helpers';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return staticParamsFromSlugs(communityServices);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findBySlug(communityServices, slug);
  if (!service) return {};
  return buildMetadata({
    title: service.title,
    description: service.summary,
    path: `/community-services/${slug}`,
  });
}

export default async function CommunityServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findBySlug(communityServices, slug);
  if (!service) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{service.title}</h1>
      <p className="mt-4 text-lg text-gray-600">{service.description}</p>

      <div className="mt-6 rounded border bg-gray-50 p-4">
        <p className="text-sm font-semibold">Eligibility</p>
        <p className="mt-1 text-sm text-gray-600">{service.eligibility}</p>
      </div>

      <div className="mt-8">
        <a
          href={service.ctaHref}
          className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
        >
          {service.ctaLabel}
        </a>
      </div>
    </section>
  );
}
