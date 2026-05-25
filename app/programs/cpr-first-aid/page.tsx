import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CPR_FIRST_AID } from '@/data/programs/cpr-first-aid';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';

export const metadata: Metadata = {
  title: CPR_FIRST_AID.metaTitle,
  description: CPR_FIRST_AID.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cpr-first-aid' },
};

export default function CprFirstAidPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative w-full" style={{ height: 'clamp(300px, 45vw, 520px)' }}>
// IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback)
        <Image
          src={CPR_FIRST_AID.heroImage}
          alt={CPR_FIRST_AID.heroImageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw" placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 to-transparent" />
        <div className="absolute bottom-8 left-6 sm:left-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            {CPR_FIRST_AID.title}
          </h1>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed">
            Live instructor. Training mannequin shipped to your door. Same-day HSI certification. $130.
          </p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">1 Day</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">4</p>
            <p className="text-slate-400 text-sm">Hours Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Online</p>
            <p className="text-slate-400 text-sm">Delivery</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{CPR_FIRST_AID.credentials.length}</p>
            <p className="text-slate-400 text-sm">Credentials</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-3">
            Get CPR and First Aid certified from the comfort of your own home. After you enroll, a training mannequin is shipped directly to your door. You join a live instructor-led session online and complete hands-on skills practice at home.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            This course meets the CPR standard required by hospitals, clinics, nursing facilities, construction sites, and most healthcare employers. Delivered through Health &amp; Safety Institute (HSI) — a nationally recognized certification body accepted by employers across healthcare, construction, and childcare. You receive your digital certification card the same day you complete the course. Included free with any Elevate program enrollment.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Enroll online. $130 standalone or free with any Elevate program.' },
              { step: 2, title: 'Enroll', desc: 'A training mannequin ships directly to your home address.' },
              { step: 3, title: 'Train', desc: 'Join the live instructor-led session online. Practice CPR, AED, and first aid on the mannequin at home.' },
              { step: 4, title: 'Credential', desc: 'Pass the HSI written and skills evaluation. Receive your digital certification card same day.' },
              { step: 5, title: 'Employment', desc: 'Add your HSI CPR/AED/First Aid certification to your resume immediately.' },
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
            {CPR_FIRST_AID.credentials.map((cred) => (
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
            programName={CPR_FIRST_AID.title}
            fundingSources={['Included free with any Elevate program']}
            selfPayPrice={130}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get certified from home today.
          </h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            Same-day AHA certification. Mannequin shipped to your door. $130 standalone or free with any program.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={CPR_FIRST_AID.cta.applyHref}
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
            {CPR_FIRST_AID.faqs.map((faq) => (
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
