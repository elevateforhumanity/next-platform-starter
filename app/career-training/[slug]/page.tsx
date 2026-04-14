import { notFound } from 'next/navigation';
import { careerTrainingAreas, statePages } from '@/content/career-training';
import { findBySlug, staticParamsFromSlugs } from '@/lib/content-helpers';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export function generateStaticParams() {
  return [
    ...staticParamsFromSlugs(careerTrainingAreas),
    ...statePages.map((s) => ({ slug: s.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = findBySlug(careerTrainingAreas, slug);
  const state = statePages.find((s) => s.slug === slug);
  const title = area ? `${area.title} Career Training` : state ? `Career Training in ${state.label}` : 'Career Training';
  const description = area?.summary ?? `Career training programs for ${state?.label ?? slug} residents.`;
  return buildMetadata({ title, description, path: `/career-training/${slug}` });
}

export default async function CareerTrainingAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = findBySlug(careerTrainingAreas, slug);
  const state = statePages.find((s) => s.slug === slug);
  if (!area && !state) return notFound();

  if (state && !area) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold">Career Training in {state.label}</h1>
        <p className="mt-4 text-lg text-gray-600">
          Credential-bearing career training programs for {state.label} residents in healthcare,
          skilled trades, technology, and beauty. WIOA funding available for eligible learners.
        </p>
        <div className="mt-10 flex gap-4">
          <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
          <a href="/career-training" className="rounded border px-5 py-3 hover:bg-gray-50">All Programs</a>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{area!.title} Career Training</h1>
      <p className="mt-4 text-lg text-gray-600">{area!.description}</p>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Programs in this area</h2>
        <ul className="mt-4 space-y-2">
          {area!.programs.map((p) => (
            <li key={p} className="rounded border px-4 py-3 text-sm">{p}</li>
          ))}
        </ul>
      </div>
      <div className="mt-10">
        <a href={area!.ctaHref} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
        <p className="mt-3 text-sm text-gray-500">
          WIOA and Workforce Ready Grant funding available for eligible Indiana residents.{' '}
          <a href={siteConfig.handoff.apply} className="underline">Check eligibility</a>.
        </p>
      </div>
    </section>
  );
}
