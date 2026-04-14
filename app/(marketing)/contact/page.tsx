import { siteConfig } from '@/content/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact',
  description: 'Contact Elevate for Humanity. Phone, email, and address for our Indianapolis office.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-4 text-gray-600">
        Reach out with questions about programs, enrollment, funding eligibility, or community services.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded border p-6">
          <h2 className="font-semibold">Phone</h2>
          <a href={`tel:${siteConfig.phone}`} className="mt-2 block text-gray-600 hover:underline">
            {siteConfig.phone}
          </a>
          <p className="mt-1 text-sm text-gray-500">{siteConfig.hours}</p>
        </div>

        <div className="rounded border p-6">
          <h2 className="font-semibold">Email</h2>
          <a href={`mailto:${siteConfig.email}`} className="mt-2 block text-gray-600 hover:underline">
            {siteConfig.email}
          </a>
          <p className="mt-1 text-sm text-gray-500">We respond within 24 hours.</p>
        </div>

        <div className="rounded border p-6">
          <h2 className="font-semibold">Location</h2>
          <p className="mt-2 text-gray-600">{siteConfig.address}</p>
          <p className="mt-1 text-sm text-gray-500">Central Indiana</p>
        </div>

        <div className="rounded border p-6">
          <h2 className="font-semibold">Apply or Enroll</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ready to start? Applications and enrollment are handled through our student portal.
          </p>
          <a
            href={siteConfig.handoff.apply}
            className="mt-3 inline-block rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Start Application
          </a>
        </div>
      </div>
    </section>
  );
}
