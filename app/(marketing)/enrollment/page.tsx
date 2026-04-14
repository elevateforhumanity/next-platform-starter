import { siteConfig } from '@/content/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Enrollment',
  description: 'Enroll in a career training program at Elevate for Humanity. Start your application today.',
  path: '/enrollment',
});

export default function EnrollmentPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Enrollment</h1>
      <p className="mt-4 text-lg text-gray-600">
        Applications and enrollment are handled through our student portal at{' '}
        <a href={siteConfig.learnUrl} className="underline">
          learn.elevateforhumanity.org
        </a>.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded border p-5">
          <h2 className="font-semibold">Step 1 — Submit an application</h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete the online application. Takes about 10 minutes.
          </p>
        </div>
        <div className="rounded border p-5">
          <h2 className="font-semibold">Step 2 — Funding review</h2>
          <p className="mt-2 text-sm text-gray-600">
            We will review your eligibility for WIOA, Workforce Ready Grant, and other funding sources.
          </p>
        </div>
        <div className="rounded border p-5">
          <h2 className="font-semibold">Step 3 — Enrollment confirmation</h2>
          <p className="mt-2 text-sm text-gray-600">
            Once funding is confirmed, you will receive enrollment documents and your start date.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <a
          href={siteConfig.handoff.apply}
          className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
        >
          Start Application
        </a>
      </div>
    </section>
  );
}
