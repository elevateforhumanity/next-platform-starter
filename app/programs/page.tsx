import Link from 'next/link';
import { programs } from '@/content/programs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Programs',
  description: 'Career training programs in healthcare, skilled trades, technology, beauty, and business. WIOA and Workforce Ready Grant funding available.',
  path: '/programs',
});

export default function ProgramsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Programs</h1>
      <p className="mt-4 text-gray-600">
        Credential-bearing programs in healthcare, skilled trades, technology, beauty, and business.
        Most programs complete in 4–12 weeks. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {programs.map((program) => (
          <article key={program.slug} className="rounded border p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold">{program.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{program.summary}</p>
            <Link
              href={`/programs/${program.slug}`}
              className="mt-4 inline-block text-sm underline"
            >
              View program
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
