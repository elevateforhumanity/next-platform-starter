import Link from 'next/link';
import { communityServices } from '@/content/cf-community-services';
import { buildMetadata } from '@/lib/cf-seo';

export const metadata = buildMetadata({
  title: 'Community Services',
  description: 'Free VITA tax preparation, mental wellness support, WIOA-funded job training, and employment services for qualifying Indiana residents.',
  path: '/community-services',
});

export default function CommunityServicesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Community Services</h1>
      <p className="mt-4 text-slate-700">
        Free and low-cost services for qualifying Indiana residents. One place to access
        tax help, mental wellness support, funded job training, and employment services.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {communityServices.map((service) => (
          <article key={service.slug} className="rounded border p-6 hover:bg-slate-50">
            <h2 className="text-xl font-semibold">{service.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{service.summary}</p>
            <p className="mt-2 text-xs text-slate-600">Eligibility: {service.eligibility}</p>
            <Link
              href={`/community-services/${service.slug}`}
              className="mt-4 inline-block text-sm underline"
            >
              Learn more
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
