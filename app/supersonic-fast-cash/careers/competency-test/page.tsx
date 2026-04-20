import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function CompetencyTestPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-training-hero.jpg"
        alt="Tax preparer competency test"
        title="Tax Preparer Competency Assessment"
        subtitle="Test your tax knowledge before joining the Supersonic Fast Cash team."
      />

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 space-y-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">About the Assessment</h2>
            <p className="text-slate-600 leading-relaxed">
              Our competency test helps us place new preparers at the right level and identify any
              training gaps before you start with clients. It covers fundamental federal tax concepts
              tested on the IRS PTIN registration.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { label: 'Format', value: '40 multiple-choice questions' },
              { label: 'Time limit', value: '60 minutes' },
              { label: 'Passing score', value: '75% or higher' },
              { label: 'Retakes', value: 'One free retake; third attempt after 30 days' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-slate-900 font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Topics Covered</h2>
            <ul className="space-y-3">
              {[
                'Filing status and dependency rules',
                'W-2 and 1099 income reporting',
                'Standard vs. itemized deductions',
                'Earned Income Tax Credit (EITC) eligibility',
                'Child Tax Credit and Additional Child Tax Credit',
                'Self-employment income and Schedule C basics',
                'IRS e-file procedures and due diligence',
                'Preparer ethics under IRS Circular 230',
              ].map((topic) => (
                <li key={topic} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-2" aria-hidden="true" />
                  <span className="text-slate-600">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-brand-blue-900 text-white rounded-2xl p-8 space-y-4">
            <h2 className="text-xl font-bold">Ready to Take the Test?</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              The assessment is administered in person at our Indianapolis office or via supervised
              video call. Schedule your session by contacting our careers team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="tel:3173143757"
                className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center"
              >
                Call (317) 314-3757
              </a>
              <Link
                href="/supersonic-fast-cash/careers/apply"
                className="inline-block border-2 border-white text-white hover:bg-white hover:text-brand-blue-900 font-bold px-6 py-3 rounded-lg transition-colors text-center"
              >
                Apply First
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
