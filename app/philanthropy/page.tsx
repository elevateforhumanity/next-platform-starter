import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';
export const metadata = buildMetadata({ title: 'Philanthropy', description: 'Philanthropic giving and community investment programs.', path: '/philanthropy' });
export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Philanthropy</h1>
      <p className="mt-4 text-gray-600">Philanthropic giving and community investment programs.</p>
      <div className="mt-8 flex gap-4">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
        <a href="mailto:info@elevateforhumanity.org" className="rounded border px-5 py-3 hover:bg-gray-50">Contact Us</a>
      </div>
    </section>
  );
}
