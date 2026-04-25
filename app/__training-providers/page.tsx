import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';

export const metadata = buildMetadata({
  title: 'Training Providers',
  description: 'Partner with Elevate as a training provider or host site.',
  path: '/training-providers',
});

export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Training Providers</h1>
      <p className="mt-4 text-slate-700">Partner with Elevate as a training provider or host site.</p>
      <div className="mt-8 flex gap-4">
        <a href="mailto:partnerships@elevateforhumanity.org" className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">
          Get in Touch
        </a>
        <a href={siteConfig.handoff.apply} className="rounded border px-5 py-3 hover:bg-slate-50">
          Apply Now
        </a>
      </div>
    </section>
  );
}
