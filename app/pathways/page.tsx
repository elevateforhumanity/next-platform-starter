import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export const metadata = buildMetadata({
  title: 'Career Pathways',
  description: 'Structured career pathways from training to employment in healthcare, skilled trades, technology, and beauty.',
  path: '/pathways',
});

const pathways = [
  { slug: 'outcomes', title: 'Outcomes', summary: 'Graduate employment rates, wage data, and credential completion statistics.' },
  { slug: 'partners', title: 'Pathway Partners', summary: 'Employers and organizations that hire Elevate graduates.' },
  { slug: 'training-model', title: 'Training Model', summary: 'How our competency-based, credential-first training model works.' },
];

export default function PathwaysPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Career Pathways</h1>
      <p className="mt-4 text-gray-600">
        Every Elevate program is built around a clear pathway — from enrollment to credential to employment.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {pathways.map((p) => (
          <article key={p.slug} className="rounded border p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{p.summary}</p>
            <Link href={`/pathways/${p.slug}`} className="mt-4 inline-block text-sm underline">Learn more</Link>
          </article>
        ))}
      </div>
      <div className="mt-10">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
      </div>
    </section>
  );
}
