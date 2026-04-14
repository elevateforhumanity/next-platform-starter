import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export const metadata = buildMetadata({
  title: 'For Employers',
  description: 'Workforce training partnerships, hiring pipelines, and apprenticeship sponsorship for employers.',
  path: '/for-employers',
});

export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">For Employers</h1>
      <p className="mt-4 text-gray-600">Workforce training partnerships, hiring pipelines, and apprenticeship sponsorship for employers.</p>
      <div className="mt-8 flex gap-4">
        <a href="mailto:partnerships@elevateforhumanity.org" className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">
          Get in Touch
        </a>
        <a href={siteConfig.handoff.apply} className="rounded border px-5 py-3 hover:bg-gray-50">
          Apply Now
        </a>
      </div>
    </section>
  );
}
