import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export const metadata = buildMetadata({
  title: 'Workforce Partners',
  description: 'Employer and workforce board partners who connect learners to jobs and funding.',
  path: '/workforce-partners',
});

export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Workforce Partners</h1>
      <p className="mt-4 text-gray-600">Employer and workforce board partners who connect learners to jobs and funding.</p>
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
