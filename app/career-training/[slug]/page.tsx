import { notFound } from 'next/navigation';
import { careerTrainingAreas } from '@/content/career-training';
import { findBySlug, staticParamsFromSlugs } from '@/lib/content-helpers';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export function generateStaticParams() {
  return staticParamsFromSlugs(careerTrainingAreas);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = findBySlug(careerTrainingAreas, slug);
  if (!area) return {};
  return buildMetadata({
    title: `${area.title} Career Training`,
    description: area.summary,
    path: `/career-training/${slug}`,
  });
}

export default async function CareerTrainingAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = findBySlug(careerTrainingAreas, slug);
  if (!area) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{area.title} Career Training</h1>
      <p className="mt-4 text-lg text-gray-600">{area.description}</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Programs in this area</h2>
        <ul className="mt-4 space-y-2">
          {area.programs.map((p) => (
            <li key={p} className="rounded border px-4 py-3 text-sm">{p}</li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <a
          href={area.ctaHref}
          className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
        >
          Apply Now
        </a>
        <p className="mt-3 text-sm text-gray-500">
          WIOA and Workforce Ready Grant funding available for eligible Indiana residents.{' '}
          <a href={siteConfig.handoff.apply} className="underline">Check eligibility</a>.
        </p>
      </div>
    </section>
  );
}
