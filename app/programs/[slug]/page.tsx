import { notFound } from 'next/navigation';
import { programs } from '@/content/programs';
import { findBySlug, staticParamsFromSlugs } from '@/lib/content-helpers';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return staticParamsFromSlugs(programs);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = findBySlug(programs, slug);
  if (!program) return {};
  return buildMetadata({
    title: program.title,
    description: program.summary,
    path: `/programs/${slug}`,
  });
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = findBySlug(programs, slug);
  if (!program) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{program.title}</h1>
      <p className="mt-4 text-lg text-gray-600">{program.description}</p>

      <div className="mt-8 space-y-6">
        {program.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <p className="mt-2 text-gray-600">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <a
          href={program.ctaHref}
          className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
        >
          {program.ctaLabel}
        </a>
      </div>
    </section>
  );
}
