import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata = {
  title: 'Tax Preparer Training Program | Supersonic Fast Cash',
};

const steps = [
  {
    step: '1',
    title: 'Enroll in Training',
    desc: 'Complete our 40-hour paid training program. Training covers individual income tax preparation, IRS rules, common credits and deductions, and e-file procedures.',
  },
  {
    step: '2',
    title: 'Register for Your PTIN',
    desc: 'We guide you through registering for your IRS Preparer Tax Identification Number (PTIN) — required by law for all paid tax preparers.',
  },
  {
    step: '3',
    title: 'Pass the Competency Assessment',
    desc: 'Complete a final competency assessment to demonstrate your readiness to prepare returns for clients independently.',
  },
  {
    step: '4',
    title: 'Start Preparing Returns',
    desc: 'Join our team for tax season and begin preparing returns under supervision. Most new preparers complete their first solo return within 2 weeks of training.',
  },
];

export default function TrainingPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/supersonic-training-hero.jpg"
        alt="Tax preparer training program"
        title="Tax Preparer Training Program"
        subtitle="Earn your PTIN and start a career in tax preparation — all with paid training."
      />

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
          <p className="text-slate-600 leading-relaxed">
            Our tax preparer training program provides everything you need to go from no experience to
            certified tax professional. Training is <strong>paid at $15/hour</strong>, takes approximately
            2 weeks to complete, and covers federal individual income tax preparation from start to finish.
            Upon completion, you will be eligible to prepare returns for clients at Supersonic Fast Cash
            or open your own sub-office.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Path to PTIN Certification</h2>
          <div className="space-y-5">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-5">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-red-600 text-white font-black text-sm flex items-center justify-center">
                  {step}
                </span>
                <div>
                  <p className="font-bold text-slate-900 mb-1">{title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Training Details</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: '40 Hours', desc: 'Total training hours' },
              { label: '$15/hr', desc: 'Paid during training' },
              { label: '2 Weeks', desc: 'Typical completion time' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                <p className="text-3xl font-black text-brand-red-600 mb-1">{label}</p>
                <p className="text-slate-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/supersonic-fast-cash/careers/apply"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            Apply to Start Training
          </Link>
        </div>
      </div>
    </>
  );
}
