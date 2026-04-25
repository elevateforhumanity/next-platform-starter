
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';


export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
  description: 'DOL-registered apprenticeship sponsor and ETPL-approved training provider. Get trained, credentialed, and placed in a job — often at no cost through WIOA or state funding.',
  keywords: 'workforce training Indianapolis, WIOA training Indiana, DOL registered apprenticeship, ETPL approved training provider, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
    description: 'Get trained, credentialed, and placed in a job — often at no cost through WIOA or state funding.',
  },
};

export default function HomePage() {
  return (
    <main>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <HeroVideo
        videoSrcDesktop={heroBanners.home.videoSrcDesktop}
        posterImage={heroBanners.home.posterImage}
        voiceoverSrc={heroBanners.home.voiceoverSrc}
        microLabel={heroBanners.home.microLabel}
        belowHeroHeadline={heroBanners.home.belowHeroHeadline}
        belowHeroSubheadline={heroBanners.home.belowHeroSubheadline}
        ctas={[heroBanners.home.primaryCta, heroBanners.home.secondaryCta].filter(Boolean)}
        trustIndicators={heroBanners.home.trustIndicators}
        transcript={heroBanners.home.transcript}
      />

      {/* ── PROGRAMS — visual cards ───────────────────────────────────────── */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">
            Training Programs
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">
            Pick a career. Start in weeks.
          </h2>
          <p className="text-slate-500 text-sm text-center mb-10 max-w-xl mx-auto">
            Healthcare, skilled trades, CDL, cosmetology, and more — each with a real credential at the end.
          </p>
          <ProgramVideoCards />
          <div className="mt-10 text-center">
            <Link
              href="/programs"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm"
            >
              View All Programs →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 h-56 sm:h-72 overflow-hidden">
        <div className="relative">
          <Image
            src="/images/pages/comp-home-pathways-train.jpg"
            alt="Learner in training"
            fill
            className="object-cover"
            sizes="33vw"
          />
        </div>
        <div className="relative">
          <Image
            src="/images/pages/comp-home-highlight-health.jpg"
            alt="Healthcare training"
            fill
            className="object-cover"
            sizes="33vw"
          />
        </div>
        <div className="relative">
          <Image
            src="/images/pages/comp-home-highlight-success.jpg"
            alt="Graduate success"
            fill
            className="object-cover"
            sizes="33vw"
          />
        </div>
      </section>

      {/* ── FUNDING ──────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-14 px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center gap-10">

          <div className="flex-1">
            <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Funding</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              Most students pay $0.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-lg">
              WIOA, Workforce Ready Grant, and FSSA IMPACT funding covers tuition, books, and exam fees
              for eligible Indiana residents. Check in two minutes — no commitment.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['WIOA', 'Workforce Ready Grant', 'FSSA IMPACT', 'Job Ready Indy'].map((f) => (
                <span
                  key={f}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {f}
                </span>
              ))}
            </div>
            <Link
              href="/check-eligibility"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check My Eligibility
            </Link>
          </div>

          <div className="relative w-full lg:w-80 h-56 lg:h-64 rounded-2xl overflow-hidden shrink-0">
            <Image
              src="/images/pages/comp-home-pathways-support.jpg"
              alt="Funding support"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
          </div>
        </div>
      </section>

      {/* ── WHO WE SERVE ─────────────────────────────────────────────────── */}
      <section className="bg-white py-14 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-extrabold text-slate-900 text-center mb-8">Who we work with</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                label: 'Learners',
                desc: 'Get trained, credentialed, and placed — often at no cost.',
                href: '/apply',
                cta: 'Apply Now',
              },
              {
                label: 'Workforce Agencies',
                desc: 'Refer participants, track WIOA outcomes, and document compliance.',
                href: '/for-agencies',
                cta: 'Agency Info',
              },
              {
                label: 'Employers',
                desc: 'Hire trained graduates and access OJT wage reimbursement.',
                href: '/for-employers',
                cta: 'Employer Info',
              },
            ].map((b) => (
              <div key={b.label} className="border border-slate-200 rounded-xl p-6 flex flex-col">
                <h3 className="text-base font-bold text-slate-900 mb-2">{b.label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">{b.desc}</p>
                <Link
                  href={b.href}
                  className="text-brand-red-600 hover:text-brand-red-700 text-sm font-bold transition-colors"
                >
                  {b.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-brand-red-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to start?</h2>
          <p className="text-red-100 text-sm mb-8">
            Apply online, check your funding eligibility, or call us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/apply"
              className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/check-eligibility"
              className="border-2 border-white/60 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center"
            >
              Check Eligibility
            </Link>
          </div>
          <p className="mt-6 text-red-200 text-xs">
            Or call / text{' '}
            <a href="tel:3173143757" className="text-white font-bold underline hover:text-red-100 transition-colors">
              (317) 314-3757
            </a>
          </p>
        </div>
      </section>

    </main>
  );
}
