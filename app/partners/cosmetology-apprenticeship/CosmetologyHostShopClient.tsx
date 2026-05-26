'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardList, FileText, PenLine, Lock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu';

interface Props {
  isApproved?: boolean;
}

export default function CosmetologyHostShopClient({ isApproved = false }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Cosmetology Apprenticeship' }]} />
      </div>

      {/* Hero image — no overlay, no text on image per design standard */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(280px, 45vw, 560px)' }}
      >
        <Image
          src="/images/pages/cosmetology-apprenticeship-hero.webp"
          alt="Cosmetology apprentice training at a licensed salon"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          placeholder="empty"
        />
      </div>

      {/* Hero content — below image, never overlaid */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <span className="inline-block bg-purple-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            DOL Registered Apprenticeship
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
            Indiana Cosmetology Apprenticeship
          </h1>
          <p className="text-slate-600 text-lg max-w-xl">
            Host an apprentice. Grow your salon. Build the next generation of licensed cosmetologists.
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="py-16 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4">Cosmetology Host Salon Program</h2>
          <p className="text-xl font-medium text-black mb-8 max-w-2xl mx-auto">
            Host apprentices in your salon. Develop talent. Grow your team through Indiana&apos;s
            USDOL Registered Cosmetology Apprenticeship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/cosmetology-apprenticeship/apply"
              className="inline-flex items-center justify-center px-10 py-4 bg-purple-600 text-white rounded-xl font-extrabold text-lg hover:bg-purple-700 transition-colors"
            >
              Apply as a Host Salon <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-4 border-2 border-brand-blue-600 text-brand-blue-600 rounded-xl font-extrabold text-lg hover:bg-brand-blue-50 transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">How the Program Works</h2>
          <p className="text-lg font-medium text-black text-center mb-12 max-w-2xl mx-auto">
            The Indiana Cosmetology Apprenticeship is a USDOL Registered Apprenticeship. Your salon hosts
            apprentices who train under your licensed cosmetologists while earning a wage.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Apply & Get Approved', desc: 'Submit your application, complete a Zoom site visit, and sign the MOU. Approval takes about 1 week.' },
              { n: '2', title: 'Host an Apprentice', desc: 'We match qualified apprentices to your salon. They complete 2,000 hours of on-the-job training under your supervision.' },
              { n: '3', title: 'Grow Your Team', desc: 'Apprentices complete theory through Elevate LMS, then sit for the Indiana State Board cosmetology exam. You get a trained, licensed cosmetologist.' },
            ].map((item) => (
              <div key={item.n} className="text-center">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold text-xl">{item.n}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm font-medium text-black">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">What Host Salons Need to Know</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Workers' Compensation", desc: "Host salons must carry workers' comp insurance for apprentices. If you don't have it yet, we can help you understand your options." },
              { title: 'Pay Structure', desc: 'Apprentices must be paid at least minimum wage ($7.25/hr). You choose the model — hourly, commission, or hybrid.' },
              { title: 'Supervising Cosmetologist', desc: 'Designate a licensed Indiana cosmetologist (min. 2 years experience) to supervise apprentices and verify hours and competencies.' },
              { title: 'Valid Salon License', desc: 'Your salon must hold a valid Indiana salon license and be in good standing with the IPLA.' },
              { title: 'ITIN Accepted', desc: 'Apprentices may use an ITIN (Individual Taxpayer Identification Number) in place of an SSN for enrollment.' },
              { title: 'Video Site Visit', desc: 'Before final approval, we conduct a short Zoom site visit (~15 minutes) to confirm your salon meets requirements.' },
              { title: 'DOL RAPIDS Listing', desc: 'Approved salons are listed on the U.S. Department of Labor RAPIDS system as registered apprenticeship worksites.' },
              { title: 'No Cost to Apply', desc: 'There is no fee to become a host salon. You pay the apprentice a wage — Elevate handles program administration and DOL compliance.' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm font-medium text-black">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Approval Timeline</h2>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Submit Application', time: 'Day 1', desc: 'Complete the online host salon application form.' },
              { step: '2', title: 'License Verification', time: 'Days 1–3', desc: 'We verify your salon license and supervisor credentials with IPLA.' },
              { step: '3', title: 'Video Site Visit', time: 'Days 3–5', desc: 'A 15-minute Zoom walkthrough of your salon.' },
              { step: '4', title: 'MOU Signing', time: 'Days 5–6', desc: 'Review and sign the Memorandum of Understanding.' },
              { step: '5', title: 'Approved', time: '~1 Week', desc: 'Your salon is approved and listed as a registered DOL worksite.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">{item.step}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <span className="text-xs bg-slate-100 text-black px-2 py-0.5 rounded-full">{item.time}</span>
                  </div>
                  <p className="text-sm font-medium text-black">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How much does it cost to become a host salon?', a: 'No fee. You pay the apprentice a wage. Elevate handles program administration, theory training, and DOL compliance.' },
              { q: "Do I need workers' comp insurance?", a: "Yes. Workers' compensation is required for all apprentices." },
              { q: 'How are apprentices paid?', a: 'At least minimum wage ($7.25/hr). You choose the model — hourly, commission, or hybrid.' },
              { q: 'How long does the apprenticeship last?', a: 'Apprentices complete 2,000 hours of on-the-job training. Full-time is about 1 year.' },
              { q: 'Can apprentices use an ITIN instead of SSN?', a: 'Yes. We accept ITIN for enrollment in place of a Social Security Number.' },
              { q: 'What happens after the apprentice finishes?', a: 'They sit for the Indiana State Board cosmetology license exam. Many salons hire their apprentices as licensed cosmetologists.' },
              { q: 'Will my salon be listed publicly?', a: 'Yes. Approved host salons are listed on the U.S. Department of Labor RAPIDS system as registered apprenticeship worksites.' },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer font-bold text-black hover:bg-slate-50 transition-colors">
                  {item.q}
                </summary>
                <div className="px-6 pb-4 text-sm font-medium text-black">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Host an Apprentice?</h2>
          <p className="text-lg font-medium text-white mb-8">
            Join the Indiana Cosmetology Apprenticeship program and start developing talent for your salon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/cosmetology-apprenticeship/apply"
              className="inline-flex items-center justify-center px-10 py-4 bg-purple-600 text-white rounded-xl font-extrabold text-lg hover:bg-purple-700 transition-colors"
            >
              Start Your Application <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href="tel:+13173143757"
              className="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-white rounded-xl font-extrabold text-lg hover:bg-white/10 transition-colors"
            >
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>

      {/* Onboarding steps — shown after approval */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-6 h-6 rounded-full bg-purple-600 inline-block flex-shrink-0" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900">After Your Application Is Approved</h2>
          </div>
          <p className="text-sm font-medium text-black mb-6">
            Once your host salon application is reviewed and approved, complete these four steps to receive your first apprentice placement.
          </p>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              {isApproved
                ? 'Your host salon account is approved. Log in to complete onboarding and receive apprentice placements.'
                : 'These steps require an approved host salon account. You will be prompted to log in.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                n: '1', icon: BookOpen, label: 'Read the Partner Handbook',
                desc: 'Covers your responsibilities, supervision requirements, hour tracking, and compensation rules.',
                href: '/partners/cosmetology-apprenticeship/handbook',
              },
              {
                n: '2', icon: ClipboardList, label: 'Acknowledge Policies',
                desc: 'Review and acknowledge program policies, wage requirements, and supervision standards.',
                href: '/partners/cosmetology-apprenticeship/policy-acknowledgment',
              },
              {
                n: '3', icon: FileText, label: 'Complete Required Forms',
                desc: 'Submit your salon license, insurance certificate, and cosmetologist-on-file documentation.',
                href: '/partners/cosmetology-apprenticeship/forms',
              },
              {
                n: '4', icon: PenLine, label: 'Sign the MOU',
                desc: 'Digitally sign the Memorandum of Understanding to finalize your host salon agreement.',
                href: '/partners/cosmetology-apprenticeship/sign-mou',
              },
            ].map((item) => (
              <Link
                key={item.n}
                href={item.href}
                className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-400 hover:shadow-sm transition group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 font-bold text-lg group-hover:bg-purple-600 group-hover:text-white transition">
                  {item.n}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-slate-900">{item.label}</h3>
                  </div>
                  <p className="text-sm text-black">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-xs text-black text-center">
            Already approved?{' '}
            <Link href="/login?redirect=/partners/cosmetology-apprenticeship/forms" className="underline text-purple-600">
              Log in to your host salon account
            </Link>{' '}
            to access these steps. Questions? Call{' '}
            <a href="tel:3173143757" className="underline">(317) 314-3757</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
