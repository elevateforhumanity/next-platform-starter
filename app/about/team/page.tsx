import Link from 'next/link';
import { teamMembers } from '@/content/team';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Our Team',
  description: 'Meet the Elevate for Humanity team — educators, workforce specialists, and community advocates.',
  path: '/about/team',
});

export default function TeamPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Our Team</h1>
      <p className="mt-4 text-gray-600">
        Educators, workforce specialists, and community advocates committed to learner success.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {teamMembers.map((member) => (
          <article key={member.slug} className="rounded border p-6 hover:bg-gray-50">
            <h2 className="text-xl font-semibold">{member.name}</h2>
            <p className="text-sm text-gray-500">{member.title}</p>
            <p className="mt-2 text-sm text-gray-600">{member.bio}</p>
            <Link href={`/about/team/${member.slug}`} className="mt-3 inline-block text-sm underline">
              Read more
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
