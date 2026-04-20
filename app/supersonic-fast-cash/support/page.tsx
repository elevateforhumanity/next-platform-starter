export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function SupportPage() {
  const faqs = [
    {
      q: 'How do I check my refund status?',
      a: 'Use the IRS "Where\'s My Refund" tool at irs.gov. You\'ll need your Social Security number, filing status, and exact refund amount. Most direct-deposit refunds arrive within 21 days of e-filing.',
    },
    {
      q: "I filed but haven't heard back — what should I do?",
      a: 'Allow 24–48 hours for your e-file confirmation email to arrive. If you haven\'t received it after 48 hours, call us at (317) 314-3757 and we\'ll check the status of your submission immediately.',
    },
    {
      q: 'I need to amend my return — can you help?',
      a: 'Yes. Call us and we\'ll review what needs to change. We handle all Form 1040-X amendments. A fee may apply depending on the complexity of the change.',
    },
    {
      q: 'Where are my tax documents?',
      a: 'All documents are stored in your secure client portal. If you need copies or can\'t access the portal, contact us and we\'ll send them to you directly.',
    },
    {
      q: 'How do I qualify for the refund advance?',
      a: 'File your return with Supersonic Fast Cash, have an expected refund of $1,000 or more, provide a valid government-issued photo ID, and have a direct deposit bank account. Approval takes minutes.',
    },
    {
      q: 'What if I receive an IRS notice?',
      a: "Don't panic. Every return we prepare includes one full year of audit protection at no extra cost. Call us immediately at (317) 314-3757 and bring the notice. We'll handle the IRS response on your behalf.",
    },
  ];

  return (
    <>
      <SupersonicPageHero
        image="/images/pages/faq-page-1.jpg"
        alt="Support center — tax help and FAQs"
        title="Support Center"
        subtitle="Quick answers and direct help."
      />

      <main className="max-w-4xl mx-auto px-4 py-14 space-y-16">

        {/* FAQ accordion */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <details key={q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center gap-4">
                  <span>{q}</span>
                  <span className="text-brand-red-600 group-open:rotate-45 transition-transform text-xl leading-none flex-shrink-0">+</span>
                </summary>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact strip */}
        <section className="bg-brand-blue-900 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-bold mb-1">Still need help?</p>
            <p className="text-white/80">Our team is available Mon–Fri 9am–7pm ET.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="tel:3173143757"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-center"
            >
              Call (317) 314-3757
            </a>
            <Link
              href="/supersonic-fast-cash/contact"
              className="inline-block bg-white text-brand-blue-900 hover:bg-slate-100 font-bold px-7 py-3 rounded-xl transition-colors text-center"
            >
              Send Email
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
