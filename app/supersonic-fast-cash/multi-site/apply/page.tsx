export const dynamic = 'force-static';
export const revalidate = 86400;

import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Apply for a Sub-Office or Franchise | Supersonic Fast Cash',
};

const requirements = [
  'PTIN (IRS Preparer Tax Identification Number) or willingness to register',
  'Clean background check',
  '$1,500 startup fee (payment plans available)',
  'Commitment to 40 hours of paid training',
];

export default function MultiSiteApplyPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-training-hero.jpg"
        alt="Apply for a franchise or sub-office"
        title="Apply for a Sub-Office or Franchise"
        subtitle="Tell us about yourself and we'll follow up within 24 hours."
      />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        <div className="bg-brand-blue-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-xl font-black mb-3">Ready to Start Your Application?</h2>
          <p className="text-blue-200 leading-relaxed mb-6">
            To begin your application, reach out to our franchise team directly. We review every
            application personally and respond within one business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:apply@supersonicfastcash.com"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Email Apply
            </a>
            <a
              href="tel:3173143757"
              className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Call (317) 314-3757
            </a>
          </div>
          <p className="text-blue-300 text-sm mt-4">Ask for the franchise team when you call.</p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Requirements Checklist</h2>
          <p className="text-slate-600 mb-5 leading-relaxed">
            Before applying, make sure you meet — or are prepared to meet — the following requirements:
          </p>
          <ul className="space-y-3">
            {requirements.map((req) => (
              <li key={req} className="flex items-start gap-3 text-slate-700">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-2">What to Include in Your Email</h3>
          <ul className="space-y-1 text-slate-600 text-sm">
            {[
              'Your full name and city/state',
              'Which program you are interested in (sub-office, satellite, or full franchise)',
              'Whether you currently hold a PTIN',
              'Any previous tax preparation experience',
              'Your preferred start date',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="text-center">
          <a
            href="mailto:apply@supersonicfastcash.com"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            Email Apply
          </a>
        </div>
      </div>
    </>
  );
}
