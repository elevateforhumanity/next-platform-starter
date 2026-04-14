import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export const metadata = buildMetadata({
  title: 'Our Mission',
  description: 'Elevate for Humanity exists to create accessible career pathways and community support for underserved populations.',
  path: '/about/mission',
});

export default function MissionPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Our Mission</h1>
      <p className="mt-6 text-lg text-gray-600">
        Elevate for Humanity exists to create accessible career pathways, skill-building programs,
        and community support services for underserved populations across the Midwest and beyond.
      </p>
      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">What We Do</h2>
          <p className="mt-3 text-gray-600">
            We deliver credential-bearing workforce training in healthcare, skilled trades, technology,
            and beauty — with WIOA and Workforce Ready Grant funding available for eligible learners.
            Every program is designed to move people from enrollment to employment in weeks, not years.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Who We Serve</h2>
          <p className="mt-3 text-gray-600">
            Adults seeking career change, dislocated workers, justice-involved individuals, and
            community members who need a clear, supported pathway into stable employment.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">How We Work</h2>
          <p className="mt-3 text-gray-600">
            Through partnerships with workforce boards, employers, community organizations, and
            funding agencies, we connect learners to training, credentials, and jobs — with
            wraparound support at every step.
          </p>
        </div>
      </div>
      <div className="mt-10">
        <a
          href={siteConfig.handoff.apply}
          className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800"
        >
          Start Your Journey
        </a>
      </div>
    </section>
  );
}
