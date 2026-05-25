import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CNA } from '@/data/programs/cna';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';

export const metadata: Metadata = {
  title: CNA.metaTitle,
  description: CNA.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cna' },
};

export default function CNAPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative w-full" style={{ height: 'clamp(300px, 45vw, 520px)' }}>
// IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback)
        <Image
          src={CNA.heroImage}
          alt={CNA.heroImageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 to-transparent" />
        <div className="absolute bottom-8 left-6 sm:left-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            {CNA.title}
          </h1>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            Indiana state certification in 6 weeks. Clinical rotations at licensed facilities. State exam proctored on-site.
          </p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{CNA.durationWeeks} Weeks</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{CNA.hoursPerWeekMin}–{CNA.hoursPerWeekMax}</p>
            <p className="text-slate-400 text-sm">Hours / Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white capitalize">{CNA.deliveryMode}</p>
            <p className="text-slate-400 text-sm">Delivery</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{CNA.credentials.length}</p>
            <p className="text-slate-400 text-sm">Credentials</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-3">
            Elevate&apos;s CNA program prepares you for the Indiana state Certified Nursing Assistant exam in 6 weeks. You complete supervised clinical rotations at licensed healthcare facilities and sit for the state exam on-site — no separate testing center required.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            CNAs are in high demand across Indiana hospitals, nursing homes, and home health agencies. Most graduates receive job offers before or immediately after completing the program. Starting pay ranges from $16–$20/hr in the Indianapolis metro area.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application online. No prior healthcare experience required.' },
              { step: 2, title: 'Enroll', desc: 'Complete enrollment paperwork and background check. Confirm funding or self-pay.' },
              { step: 3, title: 'Train', desc: '6 weeks of classroom instruction, skills lab, and supervised clinical rotations at licensed facilities.' },
              { step: 4, title: 'Credential', desc: 'Sit for the Indiana state CNA written and skills exam, proctored on-site at Elevate.' },
              { step: 5, title: 'Employment', desc: 'Receive job placement support and direct introductions to healthcare employer partners.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-slate-600 text-sm mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Credentials You Earn</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CNA.credentials.map((cred) => (
              <div key={cred.name} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{cred.name}</h3>
                <p className="text-xs text-brand-blue-600 font-medium mb-2">{cred.issuer}</p>
                <p className="text-sm text-slate-600">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding & Payment */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Funding &amp; Payment</h2>
          <FundingInfoBlock
            programName={CNA.title}
            fundingSources={['WIOA', 'Workforce Ready Grant', 'FSSA IMPACT', 'Job Ready Indy']}
            selfPayPrice={1850}
            regularPrice={2500}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to become a Certified Nursing Assistant?
          </h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            Training may be fully funded. State exam included. Apply in minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={CNA.cta.applyHref}
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              Apply Now
            </Link>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Check Eligibility
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {CNA.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-slate-200 overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-900 text-sm flex items-center justify-between">
                  {faq.question}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
