import { notFound } from 'next/navigation';
import { supersonicServices } from '@/content/cf-supersonic-fast-cash';
import { findBySlug, staticParamsFromSlugs } from '@/lib/cf-content-helpers';
import { buildMetadata } from '@/lib/cf-seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findBySlug(supersonicServices, slug);
  if (!service) return {};
  return buildMetadata({
    title: `${service.title} | Supersonic Fast Cash`,
    description: service.summary,
    path: `/supersonic-fast-cash/${slug}`,
  });
}

export default async function SupersonicServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = findBySlug(supersonicServices, slug);
  if (!service) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{service.title}</h1>
      <p className="mt-4 text-lg text-slate-700">{service.description}</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">What&apos;s included</h2>
        <ul className="mt-4 space-y-2">
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
              <span>·</span> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
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
