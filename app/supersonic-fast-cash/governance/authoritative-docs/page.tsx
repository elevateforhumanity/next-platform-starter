import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Authoritative Documents | Supersonic Fast Cash',
};

const docs = [
  {
    title: 'IRS Circular 230',
    desc: 'Regulations governing practice before the Internal Revenue Service. All our preparers are required to comply with Circular 230 standards of practice.',
    href: 'https://www.irs.gov/pub/irs-pdf/pcir230.pdf',
  },
  {
    title: 'IRS PTIN Requirements (IRC § 6109)',
    desc: 'Federal law requiring all paid tax return preparers to obtain and use a valid PTIN on every return they prepare for compensation.',
    href: 'https://www.irs.gov/tax-professionals/ptin-requirements-for-tax-return-preparers',
  },
  {
    title: 'IRS e-File Provider Requirements',
    desc: 'Requirements for becoming and remaining an IRS Authorized e-File Provider, including suitability standards and EFIN maintenance.',
    href: 'https://www.irs.gov/e-file-providers/become-an-authorized-e-file-provider',
  },
  {
    title: 'IRC § 7216 — Disclosure of Tax Return Information',
    desc: 'Federal law governing how tax return preparers may use and disclose client tax return information.',
    href: 'https://www.irs.gov/tax-professionals/section-7216-information-center',
  },
  {
    title: 'Indiana DOR Tax Preparer Requirements',
    desc: 'Indiana Department of Revenue requirements for paid tax preparers operating in the state.',
    href: 'https://www.in.gov/dor/',
  },
];

export default function AuthoritativeDocsPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-tax-cert.jpg"
        alt="Authoritative documents"
        title="Authoritative Documents"
        subtitle="The regulations and requirements that govern our tax preparation practice."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-6">
        <p className="text-slate-600 leading-relaxed mb-8">
          Supersonic Fast Cash LLC operates in compliance with the following authoritative federal and
          state documents. These are the primary governing sources for our practice standards.
        </p>

        {docs.map(({ title, desc, href }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-slate-200 hover:border-brand-red-600 rounded-xl px-6 py-5 transition-colors group"
          >
            <p className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors mb-1">
              {title} ↗
            </p>
            <p className="text-slate-500 text-sm">{desc}</p>
          </a>
        ))}

        <div className="text-center pt-6">
          <Link
            href="/supersonic-fast-cash/governance"
            className="text-brand-red-600 hover:underline font-semibold"
          >
            ← Back to Governance Overview
          </Link>
        </div>
      </div>
    </>
  );
}
