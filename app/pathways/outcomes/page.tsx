import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';
export const metadata = buildMetadata({ title: 'Outcomes', description: 'Elevate for Humanity — Outcomes.', path: '/pathways/outcomes' });
export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Outcomes</h1>
      <p className="mt-4 text-gray-600">Contact us at <a href="mailto:info@elevateforhumanity.org" className="underline">info@elevateforhumanity.org</a> for more information.</p>
      <div className="mt-8"><a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a></div>
    </section>
  );
}
