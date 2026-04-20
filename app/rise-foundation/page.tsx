import Link from 'next/link';
import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';

export const metadata = buildMetadata({
  title: 'RISE Foundation',
  description: 'The RISE Foundation supports addiction rehabilitation, trauma recovery, and young adult wellness programs.',
  path: '/rise-foundation',
});

const sections = [
  { slug: 'about', title: 'About RISE', summary: 'Our mission to support recovery, healing, and community wellness.' },
  { slug: 'addiction-rehabilitation', title: 'Addiction Rehabilitation', summary: 'Evidence-based support for individuals in recovery.' },
  { slug: 'trauma-recovery', title: 'Trauma Recovery', summary: 'Trauma-informed care and recovery support services.' },
  { slug: 'young-adult-wellness', title: 'Young Adult Wellness', summary: 'Programs for young adults navigating mental health and life transitions.' },
  { slug: 'divorce-support', title: 'Divorce Support', summary: 'Resources and community support for individuals navigating divorce.' },
  { slug: 'programs', title: 'All Programs', summary: 'Full list of RISE Foundation programs and services.' },
  { slug: 'donate', title: 'Donate', summary: 'Support the RISE Foundation mission.' },
  { slug: 'get-involved', title: 'Get Involved', summary: 'Volunteer, partner, or advocate with RISE Foundation.' },
];

export default function RiseFoundationPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">RISE Foundation</h1>
      <p className="mt-4 text-slate-700">
        The RISE Foundation is the community wellness arm of Elevate for Humanity, supporting
        addiction rehabilitation, trauma recovery, and young adult wellness.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <article key={s.slug} className="rounded border p-6 hover:bg-slate-50">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{s.summary}</p>
            <Link href={`/rise-foundation/${s.slug}`} className="mt-4 inline-block text-sm underline">Learn more</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
