export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Open a Supersonic Fast Cash Location | Franchise Opportunities',
};

const programs = [
  {
    name: 'Sub-Office Agreement',
    type: 'Home-Based / Remote',
    description:
      'Operate under the Supersonic Fast Cash brand from your home or a virtual office. Ideal for first-time business owners who want low overhead.',
    features: [
      'No commercial lease required',
      'Remote client intake available',
      'Full brand licensing and software access',
      '60% revenue share on all fees collected',
    ],
    fee: '$1,500 startup fee',
    requirement: 'PTIN + 40-hour training + background check',
  },
  {
    name: 'Satellite Office',
    type: 'Shared Office Space',
    description:
      'Use shared office space in an existing professional building. Great for preparers who want an in-person presence without a full lease commitment.',
    features: [
      'Shared reception and waiting area',
      'Private preparation room',
      'Signage rights in shared lobby',
      '60% revenue share on all fees collected',
    ],
    fee: '$2,500 startup fee',
    requirement: 'PTIN + 40-hour training + background check + office lease agreement',
  },
  {
    name: 'Full Franchise Location',
    type: 'Independent Office',
    description:
      'Open a standalone Supersonic Fast Cash storefront. This is the highest-volume option, with full brand presence and an exclusive territory agreement.',
    features: [
      'Exclusive territory rights within your market',
      'Full storefront branding and signage package',
      'Dedicated marketing budget support',
      '55% revenue share with higher volume potential',
    ],
    fee: '$5,000 startup fee + lease costs',
    requirement: 'PTIN + 40-hour training + background check + commercial lease',
  },
];

export default function MultiSitePage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-6.jpg"
        alt="Open a Supersonic Fast Cash location"
        title="Open a Supersonic Fast Cash Location"
        subtitle="Franchise and sub-office opportunities across the Midwest."
      />

      <div className="max-w-5xl mx-auto px-4 py-14">
        <p className="text-slate-600 text-lg text-center max-w-3xl mx-auto mb-12 leading-relaxed">
          We offer three pathways to owning a Supersonic Fast Cash tax preparation business. Whether
          you&apos;re just getting started or ready for a full storefront, we have an option that fits your
          goals and budget.
        </p>

        <div className="space-y-8">
          {programs.map((p) => (
            <div key={p.name} className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-brand-blue-900 text-white px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black">{p.name}</h2>
                    <p className="text-blue-200 text-sm mt-0.5">{p.type}</p>
                  </div>
                  <span className="bg-brand-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    {p.fee}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-5 leading-relaxed">{p.description}</p>
                <ul className="space-y-2 mb-5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-slate-600">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-slate-500">
                  <strong className="text-slate-700">Requirements:</strong> {p.requirement}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/supersonic-fast-cash/multi-site/apply"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-lg transition-colors text-lg"
          >
            Apply Now
          </Link>
          <p className="text-slate-500 text-sm mt-3">
            We&apos;ll follow up within 24 hours of receiving your application.
          </p>
        </div>
      </div>
    </>
  );
}
