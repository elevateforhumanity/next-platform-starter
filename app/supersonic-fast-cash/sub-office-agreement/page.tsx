export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Sub-Office Agreement & Franchise Opportunities | Supersonic Fast Cash',
};

export default function SubOfficeAgreementPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-page-6.jpg"
        alt="Sub-office franchise opportunities"
        title="Sub-Office Agreement & Franchise Opportunities"
        subtitle="Open a Supersonic Fast Cash tax preparation office in your community."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What&apos;s Included in a Sub-Office Agreement</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            When you sign a sub-office agreement with Supersonic Fast Cash, you receive everything you need
            to launch and operate a professional tax preparation business under our established brand.
          </p>
          <ul className="space-y-2 text-slate-600">
            {[
              'Brand licensing — operate under the Supersonic Fast Cash name and logo',
              'Comprehensive training program — 40 hours of paid tax preparer training',
              'Licensed tax preparation software access for your office',
              'Marketing materials — flyers, digital assets, and social media templates',
              'EFIN sponsorship guidance — we help you navigate IRS Electronic Filing Identification Number requirements',
              'Ongoing tax law updates throughout each filing season',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'PTIN Registration', desc: 'Active IRS Preparer Tax Identification Number required' },
              { label: 'Background Check', desc: 'Clean background check prior to agreement signing' },
              { label: '40 Hours of Training', desc: 'Completion of our paid training curriculum' },
              { label: '$1,500 Initial Fee', desc: 'One-time startup fee covers setup, software, and onboarding' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="font-bold text-slate-900 mb-1">{label}</p>
                <p className="text-slate-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Revenue Share</h2>
          <p className="text-slate-600 leading-relaxed">
            Sub-office partners retain <strong className="text-slate-900">60% of preparation fees</strong> collected
            at their location. The remaining 40% covers brand licensing, software, ongoing support, and
            quality assurance oversight from the home office. There are no hidden royalty fees or monthly
            minimums during the off-season.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ongoing Support</h2>
          <ul className="space-y-2 text-slate-600">
            {[
              'Annual training updates as IRS tax law changes each year',
              'Audit support — the home office assists if any of your clients are audited',
              'Direct access to senior preparers for complex return questions',
              'Technology support for software and e-file issues',
              'Marketing support during peak tax season (January–April)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/multi-site/apply"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            Apply for a Sub-Office Agreement
          </Link>
        </div>
      </div>
    </>
  );
}
