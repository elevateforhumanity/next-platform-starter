import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';

export const metadata = buildMetadata({
  title: 'Donate',
  description: 'Elevate for Humanity — Donate.',
  path: '/donate',
});

export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Donate</h1>
      <p className="mt-4 text-slate-700">
        For more information, contact us at{' '}
        <a href="mailto:info@elevateforhumanity.org" className="underline">
          info@elevateforhumanity.org
        </a>{' '}
        or call {siteConfig.phone}.
      </p>
      <div className="mt-8">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">
          Apply Now
        </a>
      </div>
    </section>
  );
}
