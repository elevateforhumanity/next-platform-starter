import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export const metadata = buildMetadata({
  title: 'Solutions',
  description: 'Workforce training solutions for higher education, K-12, distance learning, and employer partners.',
  path: '/solutions',
});

const solutions = [
  { slug: 'higher-ed', title: 'Higher Education', summary: 'Credential pathways and workforce training partnerships for colleges and universities.' },
  { slug: 'k12', title: 'K-12', summary: 'Career and technical education programs for high school students.' },
  { slug: 'distance-learning', title: 'Distance Learning', summary: 'Flexible online and hybrid training options for remote learners.' },
];

export default function SolutionsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Solutions</h1>
      <p className="mt-4 text-gray-600">Workforce training solutions for institutions, employers, and learners.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {solutions.map((s) => (
          <article key={s.slug} className="rounded border p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{s.summary}</p>
            <Link href={`/solutions/${s.slug}`} className="mt-4 inline-block text-sm underline">Learn more</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
