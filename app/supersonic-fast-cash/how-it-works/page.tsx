export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

const steps = [
  {
    number: 1,
    title: 'Gather Your Documents',
    body: 'Collect your W-2s, 1099s, Social Security cards, and last year\'s tax return if available.',
  },
  {
    number: 2,
    title: 'Book Your Appointment',
    body: 'Schedule online, call us at (317) 314-3757, or walk in — we welcome same-day visits.',
  },
  {
    number: 3,
    title: 'Meet with Your Preparer',
    body: 'A PTIN-certified preparer reviews your documents and prepares your return accurately.',
  },
  {
    number: 4,
    title: 'Review & Sign',
    body: 'You review every line of your return before we e-file — no surprises.',
  },
  {
    number: 5,
    title: 'Receive Your Refund',
    body: 'IRS direct deposit typically arrives within 21 days. A refund advance is available same day.',
  },
];

const faqs = [
  {
    q: 'How quickly can I get my refund advance?',
    a: 'Same business day after IRS acceptance — advances up to $7,500 with zero interest and zero fees.',
  },
  {
    q: 'Do I need an appointment?',
    a: 'Walk-ins are always welcome. Appointments get priority scheduling and shorter wait times.',
  },
  {
    q: 'What documents do I need?',
    a: 'Bring your W-2 or 1099, a photo ID, your Social Security card or number, and last year\'s return if you have it.',
  },
  {
    q: 'What if I get audited?',
    a: 'Every filing includes one year of audit support from a PTIN-credentialed preparer — at no extra charge.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-3.jpg"
        alt="Tax preparer working with a client at Supersonic Fast Cash"
        title="How Supersonic Fast Cash Works"
        subtitle="From document upload to refund in your account — here's the process."
      />

      {/* Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="space-y-10">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-red-600 text-white flex items-center justify-center text-lg font-black">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIY callout */}
      <section className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Prefer to File Yourself?</h2>
          <p className="text-slate-600 mb-6">
            Use our guided online interview — same accuracy, at your own pace.
          </p>
          <Link
            href="/supersonic-fast-cash/diy-taxes"
            className="inline-block border border-brand-blue-900 text-brand-blue-900 hover:bg-brand-blue-900 hover:text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Try DIY Filing
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <details key={faq.q} className="group border border-slate-200 rounded-lg">
                <summary className="flex justify-between items-center cursor-pointer px-5 py-4 font-semibold text-slate-900 list-none">
                  {faq.q}
                  <span className="ml-4 text-brand-red-600 text-xl leading-none group-open:rotate-45 transition-transform inline-block">+</span>
                </summary>
                <p className="px-5 pb-5 text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 bg-brand-blue-900">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-200 mb-8">File with a PTIN-credentialed preparer and get your refund fast.</p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
          >
            Start My Return
          </Link>
        </div>
      </section>
    </>
  );
}
