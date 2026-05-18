import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'WorkOne / WIOA Referrals | Workforce Agency Partners',
  description:
    'Elevate for Humanity is an approved WIOA training provider. WorkOne case managers can refer clients directly to our programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/workforce' },
};

export default function WorkforcePartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Workforce Agency Partners
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">WorkOne / WIOA Referrals</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Elevate for Humanity is an approved WIOA training provider on Indiana's ETPL. WorkOne
            case managers can refer clients directly — we handle enrollment, progress tracking, and
            reporting.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/contact"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Contact Our Team
            </Link>
            <Link
              href="/agencies"
              className="border-2 border-white/40 text-white font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Agency Overview
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">How referrals work</h2>
          <ol className="space-y-6">
            {[
              {
                n: '1',
                title: 'Case manager identifies a client',
                desc: 'Client meets WIOA eligibility criteria and is interested in a high-demand program.',
              },
              {
                n: '2',
                title: 'Referral submitted',
                desc: 'Case manager submits a referral via our partner portal or by contacting our enrollment team directly.',
              },
              {
                n: '3',
                title: 'Elevate handles enrollment',
                desc: 'We contact the client, complete intake, and confirm program placement within 48 hours.',
              },
              {
                n: '4',
                title: 'Progress reporting',
                desc: 'We provide regular attendance and progress updates to the referring case manager.',
              },
              {
                n: '5',
                title: 'Credential + placement',
                desc: 'Upon completion, we report outcomes and support job placement.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">Ready to refer a client?</h2>
          <p className="text-slate-600 text-sm mb-6">
            Contact our workforce partnerships team to set up a referral agreement or submit a
            client referral.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Contact Us
            </Link>
            <Link
              href="/agencies"
              className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Agency Resources
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
