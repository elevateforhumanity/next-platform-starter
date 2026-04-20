import Link from 'next/link';
import { supersonicServices, supersonicConfig } from '@/content/cf-supersonic-fast-cash';
import { buildMetadata } from '@/lib/cf-seo';

export const metadata = buildMetadata({
  title: 'Supersonic Fast Cash — Tax & Financial Services',
  description: supersonicConfig.description,
  path: '/supersonic-fast-cash',
});

export default function SupersonicFastCashPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">{supersonicConfig.name}</h1>
      <p className="mt-4 text-lg text-slate-700">{supersonicConfig.description}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {supersonicServices.map((service) => (
          <article key={service.slug} className="rounded border p-6 hover:bg-slate-50">
            <h2 className="text-xl font-semibold">{service.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{service.summary}</p>
            <Link
              href={`/supersonic-fast-cash/${service.slug}`}
              className="mt-4 inline-block text-sm underline"
            >
              Learn more
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded border bg-slate-50 p-6">
        <p className="font-semibold">Contact us</p>
        <p className="mt-1 text-sm text-slate-700">{supersonicConfig.phone}</p>
        <a
          href={supersonicConfig.ctaHref}
          className="mt-4 inline-block rounded bg-black px-5 py-3 text-sm text-white hover:bg-gray-800"
        >
          Book Appointment
        </a>
      </div>
    </section>
  );
}
