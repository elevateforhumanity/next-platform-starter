import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/content/site';

export const metadata = buildMetadata({
  title: 'Interview Prep',
  description: 'Elevate for Humanity career services — Interview Prep.',
  path: '/career-services/interview-prep',
});

export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Interview Prep</h1>
      <p className="mt-4 text-gray-600">
        Available to all Elevate for Humanity program graduates. Contact us to schedule your session.
      </p>
      <div className="mt-8 flex gap-4">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
        <a href="/career-services" className="rounded border px-5 py-3 hover:bg-gray-50">All Services</a>
      </div>
    </section>
  );
}
