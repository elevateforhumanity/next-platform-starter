import Link from 'next/link';
import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';

export const metadata = buildMetadata({
  title: 'Tax Services',
  description: 'Professional tax preparation, free VITA tax help, and tax tools from Supersonic Fast Cash and Elevate for Humanity.',
  path: '/tax',
});

export default function TaxPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Tax Services</h1>
      <p className="mt-4 text-slate-700">
        Professional tax preparation through Supersonic Fast Cash and free VITA tax help through the RISE Up Foundation.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/tax/professional" className="rounded border p-6 hover:bg-slate-50">
          <h2 className="font-semibold">Professional Tax Prep</h2>
          <p className="mt-1 text-sm text-slate-700">Enrolled Agent-prepared returns via Supersonic Fast Cash.</p>
        </Link>
        <Link href="/tax/free" className="rounded border p-6 hover:bg-slate-50">
          <h2 className="font-semibold">Free Tax Help (VITA)</h2>
          <p className="mt-1 text-sm text-slate-700">IRS-certified free tax preparation for eligible households.</p>
        </Link>
      </div>
      <div className="mt-8">
        <a href="/supersonic-fast-cash" className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Supersonic Fast Cash</a>
      </div>
    </section>
  );
}
