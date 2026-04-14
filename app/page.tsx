import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Workforce Training Built for Real Outcomes',
  description: siteConfig.description,
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">
            Workforce training built for real outcomes.
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Elevate for Humanity helps learners access career pathways,
            skill-building programs, and support services designed to move them
            forward.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={siteConfig.handoff.apply}
              className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              Apply Now
            </a>
            <Link href="/programs" className="rounded border px-5 py-3 hover:bg-gray-50">
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold">What we offer</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded border bg-white p-6">
              <h3 className="font-semibold">Career Training Programs</h3>
              <p className="mt-2 text-sm text-gray-600">
                Credential-bearing programs in healthcare, trades, technology, and business.
                WIOA and Workforce Ready Grant funding available for eligible participants.
              </p>
              <Link href="/programs" className="mt-4 inline-block text-sm underline">
                View programs
              </Link>
            </div>
            <div className="rounded border bg-white p-6">
              <h3 className="font-semibold">Community Services</h3>
              <p className="mt-2 text-sm text-gray-600">
                Free VITA tax preparation, mental wellness support through Selfish Inc.,
                and funded job training for qualifying Indiana residents.
              </p>
              <Link href="/community-services" className="mt-4 inline-block text-sm underline">
                Learn more
              </Link>
            </div>
            <div className="rounded border bg-white p-6">
              <h3 className="font-semibold">Funding & Support</h3>
              <p className="mt-2 text-sm text-gray-600">
                WIOA, Workforce Ready Grant, DOL apprenticeship funding, and
                buy-now-pay-later options to remove cost barriers.
              </p>
              <Link href="/funding" className="mt-4 inline-block text-sm underline">
                Explore funding
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
