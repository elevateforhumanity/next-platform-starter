export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export default function CashAdvancePage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-page-6.jpg"
        alt="Tax refund cash advance — same day"
        title="Tax Refund Cash Advance"
        subtitle="Don't wait weeks for the IRS. Get a portion of your refund the same day you file."
      />

      <main className="max-w-5xl mx-auto px-4 py-14 space-y-16">

        {/* How it differs */}
        <section className="grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Not a Loan — An Advance</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              A refund cash advance isn&rsquo;t a traditional loan. It&rsquo;s an advance on the money
              the IRS already owes you. There&rsquo;s no interest, no fees, and no credit check.
              When your refund arrives, it simply pays off the advance.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Available amounts up to <span className="font-bold text-slate-900">$7,500</span> based on your expected refund.
            </p>
          </div>
          <div className="bg-brand-blue-900 text-white rounded-2xl p-8 text-center">
            <p className="text-5xl font-black mb-2">$7,500</p>
            <p className="text-white/80">Maximum advance amount</p>
          </div>
        </section>

        {/* Requirements */}
        <section className="bg-slate-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Requirements</h2>
          <ul className="space-y-3">
            {[
              'File your return with Supersonic Fast Cash',
              'Bank account for direct deposit',
              'Expected refund of $1,000 or more',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is this a loan?',
                a: 'No. It is an advance on your actual tax refund. You are not taking on new debt — you are accessing money the IRS already owes you.',
              },
              {
                q: 'What does it cost?',
                a: 'Zero interest. Zero fees. The advance is completely free when you file your return with Supersonic Fast Cash.',
              },
              {
                q: 'How fast will I get the money?',
                a: 'The same business day after IRS acceptance of your e-filed return. Most clients receive funds within hours of filing.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white border border-slate-200 rounded-xl p-5 group">
                <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                  {q}
                  <span className="text-brand-red-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            Start Filing to Qualify
          </Link>
        </section>
      </main>
    </>
  );
}
