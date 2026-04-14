import { notFound } from 'next/navigation';
import { communityServices, statePages } from '@/content/community-services';
import { findBySlug, staticParamsFromSlugs } from '@/lib/content-helpers';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export function generateStaticParams() {
  return [
    ...staticParamsFromSlugs(communityServices),
    ...statePages.map((s) => ({ slug: s.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findBySlug(communityServices, slug);
  const state = statePages.find((s) => s.slug === slug);
  const title = service?.title ?? (state ? `Community Services in ${state.label}` : 'Community Services');
  const description = service?.summary ?? `Community support services for ${state?.label ?? slug} residents.`;
  return buildMetadata({ title, description, path: `/community-services/${slug}` });
}

export default async function CommunityServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findBySlug(communityServices, slug);
  const state = statePages.find((s) => s.slug === slug);
  if (!service && !state) return notFound();

  if (state && !service) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold">Community Services in {state.label}</h1>
        <p className="mt-4 text-lg text-gray-600">
          Community support services for {state.label} residents including workforce navigation,
          social services, and WIOA-funded training access.
        </p>
        <div className="mt-10 flex gap-4">
          <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Get Started</a>
          <a href="/community-services" className="rounded border px-5 py-3 hover:bg-gray-50">All Services</a>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{service!.title}</h1>
      <p className="mt-4 text-lg text-gray-600">{service!.description}</p>
      <div className="mt-6 rounded border bg-gray-50 p-4">
        <p className="text-sm font-semibold">Eligibility</p>
        <p className="mt-1 text-sm text-gray-600">{service!.eligibility}</p>
      </div>
      <div className="mt-8">
        <a href={service!.ctaHref} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">
          {service!.ctaLabel}
        </a>
      </div>
    </section>
  );
}
