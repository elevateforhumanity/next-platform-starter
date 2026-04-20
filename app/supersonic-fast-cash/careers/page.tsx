export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function CareersPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-training-hero.jpg"
        alt="Join the Supersonic Fast Cash team as a tax preparer"
        title="Join the Supersonic Fast Cash Team"
        subtitle="Earn extra income as a licensed tax preparer. Flexible hours. Training provided."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* Roles */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Open Roles</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Tax Preparer', tag: 'Seasonal', desc: 'Prepare individual and family tax returns during the January–April filing season. No prior experience required — training provided.' },
              { title: 'Senior Tax Preparer', tag: 'Year-Round', desc: 'Lead complex returns including Schedule C, rental income, and multi-state filings. PTIN required.' },
              { title: 'Office Manager', tag: 'Full-Time', desc: 'Coordinate scheduling, client communications, and daily office operations. Organizational skills a must.' },
              { title: 'Bookkeeping Associate', tag: 'Part-Time / Remote', desc: 'Manage monthly bookkeeping for small business clients. QuickBooks experience preferred.' },
            ].map(({ title, tag, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 rounded-full px-3 py-1 flex-shrink-0">{tag}</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What We Offer</h2>
          <ul className="space-y-3">
            {[
              'PTIN registration assistance — we help you get licensed',
              'Paid training program before your first season',
              'Commission + hourly pay structure',
              'Flexible scheduling — daytime, evening, and weekend shifts',
              'Remote preparation available for experienced preparers',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Path to join */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Your Path to Earning</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your application. We review all candidates and follow up within 3 business days.' },
              { step: '2', title: 'Complete Training', desc: 'Our paid training program covers everything — tax law, software, client communication, and compliance.' },
              { step: '3', title: 'Start Earning', desc: 'Once certified, you\'ll be assigned clients. Most preparers earn $15–$25/hr plus commission during peak season.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-blue-900 text-white font-black text-lg flex items-center justify-center">
                  {step}
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/supersonic-fast-cash/careers/apply"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Apply Now
          </Link>
          <Link
            href="/supersonic-fast-cash/careers/training"
            className="inline-block bg-white border-2 border-brand-blue-900 text-brand-blue-900 hover:bg-slate-50 font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Learn About Training
          </Link>
        </section>
      </main>
    </>
  );
}
