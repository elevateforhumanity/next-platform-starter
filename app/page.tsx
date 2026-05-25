import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import { SITE_STATS, statLabel } from '@/lib/site-stats';
import RotatingBanner from '@/components/blocks/RotatingBanner';

export const dynamic = 'force-static';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
  description:
    'DOL-registered apprenticeship sponsor and ETPL-approved training provider. Get trained, credentialed, and placed in a job — often at no cost through WIOA or state funding.',
  keywords:
    'workforce training Indianapolis, WIOA training Indiana, DOL registered apprenticeship, ETPL approved training provider, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Training — Indianapolis, Indiana',
    description:
      'Get trained, credentialed, and placed in a job — often at no cost through WIOA or state funding.',
  },
};

export default function HomePage() {
  return (
    <main>
      <HomeHeroVideo banner={heroBanners.home} />

      {/* ROTATING RED BANNER */}
      <RotatingBanner
        variant="red"
        intervalMs={4000}
        lines={[
          '🎓 Over 500 graduates placed in jobs — and counting.',
          '💰 Most students pay $0 — WIOA & state funding covers tuition, books, and exams.',
          '📋 ETPL-approved · DOL-registered apprenticeship sponsor · Indiana WorkOne partner.',
          '⚡ 14 credential programs — healthcare, trades, tech, beauty, and business.',
          '🏆 Get trained, credentialed, and hired — in as little as 6 weeks.',
          '📍 4 Indianapolis locations — evening and weekend classes available.',
        ]}
      />

      {/* PROGRAMS — lead with the product */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Training Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">Pick a career. Start in weeks.</h2>
          <p className="text-slate-500 text-sm text-center mb-10 max-w-xl mx-auto">
            Healthcare, skilled trades, CDL, cosmetology, and more — each with a real credential at the end.
          </p>
          <ProgramVideoCards count={8} />
          <div className="mt-10 text-center">
            <Link href="/programs" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
              View All Programs →
            </Link>
          </div>
        </div>
      </section>

      {/* PHOTO STRIP — proof before process */}
      <section className="grid grid-cols-1 sm:grid-cols-3">
        {[
          { src: '/images/pages/comp-home-pathways-train.webp', alt: 'Learner in workforce training', label: 'Hands-On Training', sub: 'Real skills. Real equipment.', position: 'object-center' },
          { src: '/images/pages/comp-home-highlight-health.webp', alt: 'Healthcare training', label: 'Healthcare Careers', sub: 'CNA, Phlebotomy, Medical Assistant & more.', position: 'object-center' },
          { src: '/images/pages/comp-home-highlight-success.webp', alt: 'Graduate success', label: 'Real Outcomes', sub: '500+ graduates placed in jobs.', position: 'object-center' },
        ].map((p) => (
          <div key={p.src} className="relative aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9] overflow-hidden group">
            <Image src={p.src} alt={p.alt} fill className={`object-cover ${p.position} transition-transform duration-700 group-hover:scale-105`} sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" placeholder="empty" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-white font-extrabold text-base leading-tight">{p.label}</p>
              <p className="text-white/80 text-xs mt-0.5">{p.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-900 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest text-center mb-6">How It Works</p>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { n: '1', label: 'Apply', href: '/apply' },
              { n: '2', label: 'Get Approved for Funding', href: '/check-eligibility' },
              { n: '3', label: 'Get Placed in a Program', href: '/programs' },
              { n: '4', label: 'Complete Training', href: '/how-it-works' },
              { n: '5', label: 'Test & Get Certified', href: '/how-it-works' },
              { n: '6', label: 'Get Placed into Employment', href: '/employment-support' },
            ].map((s) => (
              <Link key={s.n} href={s.href} className="flex flex-col items-center text-center gap-2 group">
                <span className="w-9 h-9 rounded-full bg-brand-red-600 group-hover:bg-brand-red-500 text-white text-sm font-extrabold flex items-center justify-center shrink-0 transition-colors">{s.n}</span>
                <p className="text-slate-300 group-hover:text-white text-xs font-semibold leading-snug transition-colors">{s.label}</p>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/how-it-works" className="inline-block border border-white/30 text-slate-900 text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
              View Full Process →
            </Link>
          </div>
        </div>
      </section>

      {/* WHO ARE YOU — entry routing */}
      <section className="bg-white border-b border-slate-100 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Who Is This For?</p>
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Find your path in 10 seconds.</h2>
          <p className="text-center text-slate-500 text-sm mb-10 max-w-xl mx-auto">Tell us where you are and we&apos;ll show you exactly what to do next.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                img: '/images/pages/for-students-hero.webp',
                alt: 'Student in workforce training program',
                label: 'I want a new career',
                sub: 'Get trained, credentialed, and placed in a job — often at $0 cost through WIOA or state funding.',
                cta: 'See Programs →',
                href: '/for-students',
                badge: 'bg-brand-red-50 text-brand-red-700',
                badgeText: 'Most popular',
              },
              {
                img: '/images/pages/funding-impact-1.webp',
                alt: 'Funding advisor helping a student',
                label: 'I need funding',
                sub: 'WIOA, SNAP E&T, Workforce Ready Grant, and Job Ready Indy can cover 100% of your training costs.',
                cta: 'Check Eligibility →',
                href: '/check-eligibility',
                badge: 'bg-blue-50 text-blue-700',
                badgeText: 'Free to check',
              },
              {
                img: '/images/pages/workforce-board-page-1.webp',
                alt: 'Workforce agency case manager',
                label: 'I refer job seekers',
                sub: 'Case managers and WorkOne staff — refer participants, track WIOA outcomes, and document compliance.',
                cta: 'Agency Tools →',
                href: '/for-agencies',
                badge: null,
                badgeText: null,
              },
              {
                img: '/images/pages/employer-handshake.webp',
                alt: 'Employer hiring program graduates',
                label: 'I want to hire',
                sub: 'Post open roles, host registered apprentices, and access OJT wage reimbursement for new hires.',
                cta: 'Employer Info →',
                href: '/for-employers',
                badge: 'bg-brand-green-50 text-brand-green-700',
                badgeText: 'Hiring incentives',
              },
              {
                img: '/images/pages/training-providers-hero.webp',
                alt: 'Training provider partner',
                label: 'I offer training',
                sub: 'Training providers and credential issuers — partner with us to access funding pipelines and expand reach.',
                cta: 'Partner With Us →',
                href: '/for-providers',
                badge: null,
                badgeText: null,
              },
            ].map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group relative rounded-2xl border border-slate-200 hover:border-brand-red-400 bg-white overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Photo */}
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <Image
                    src={r.img}
                    alt={r.alt}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    loading="lazy" placeholder="empty"
                  />
                  {r.badge && (
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${r.badge}`}>
                      {r.badgeText}
                    </span>
                  )}
                </div>
                {/* Text */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <p className="font-extrabold text-slate-900 text-sm leading-snug">{r.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{r.sub}</p>
                  <span className="text-xs font-bold text-brand-red-600 group-hover:text-brand-red-700 mt-1">{r.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDING */}
      <section className="bg-slate-50 py-16 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center gap-12">
          <div className="flex-1">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">Funding</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Most students pay $0.</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg">
              WIOA, Workforce Ready Grant, and FSSA IMPACT funding covers tuition, books, and exam fees for eligible Indiana residents. Check in two minutes — no commitment.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['WIOA', 'Workforce Ready Grant', 'FSSA IMPACT', 'Job Ready Indy'].map((f) => (
                <span key={f} className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">{f}</span>
              ))}
            </div>
            <Link href="/check-eligibility" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">
              Check My Eligibility
            </Link>
          </div>
          <div className="relative w-full lg:w-96 h-64 lg:h-72 rounded-2xl overflow-hidden shrink-0">
            <Image src="/images/pages/comp-home-pathways-support.webp" alt="Funding support advisor" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 384px" loading="lazy" placeholder="empty" />
          </div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Who We Serve</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Built for everyone in the workforce ecosystem.</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                label: 'Learners',
                desc: 'Get trained, credentialed, and placed — often at no cost.',
                href: '/for-students',
                cta: 'Apply Now',
                img: '/images/pages/for-students-hero.webp',
                alt: 'Student in workforce training',
              },
              {
                label: 'Workforce Agencies',
                desc: 'Refer participants, track WIOA outcomes, and document compliance.',
                href: '/for-agencies',
                cta: 'Agency Info',
                img: '/images/pages/about-career-pathways.webp',
                alt: 'Workforce agency advisor with participant',
              },
              {
                label: 'Employers',
                desc: 'Hire trained graduates and access OJT wage reimbursement.',
                href: '/for-employers',
                cta: 'Employer Info',
                img: '/images/pages/hire-graduates-page-1.webp',
                alt: 'Employer hiring program graduates',
              },
            ].map((b) => (
              <div key={b.label} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative w-full aspect-[16/10]">
                  <Image src={b.img} alt={b.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" loading="lazy" placeholder="empty" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{b.label}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">{b.desc}</p>
                  <Link href={b.href} className="text-brand-red-600 hover:text-brand-red-700 text-sm font-bold transition-colors">
                    {b.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES STRIP */}
      <section className="bg-slate-900 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { stat: 'Verified', label: 'Outcome Tracking' },
            { stat: statLabel.placement, label: 'Credential attainment rate' },
            { stat: '$0', label: 'Cost for eligible students' },
            { stat: `${SITE_STATS.programsOffered}+`, label: 'Programs available' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{item.stat}</p>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="max-w-5xl mx-auto mt-6 text-center text-slate-500 text-xs leading-relaxed px-4">
          * Figures are estimates based on internal participant and credential records. Eligibility and outcomes vary by program and funding source. See our{' '}
          <Link href="/impact/methodology" className="underline hover:text-slate-300 transition-colors">impact methodology</Link>.
        </p>
      </section>

      {/* FULL-WIDTH IMAGE BREAK */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        <Image src="/images/pages/career-services-hero.webp" alt="Elevate for Humanity career services" fill className="object-cover object-center" sizes="100vw" loading="lazy" placeholder="empty" />
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
          <p className="text-white text-xl sm:text-3xl font-extrabold text-center px-6 drop-shadow-lg">
            Real credentials. Real jobs. Real lives changed.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <section className="bg-brand-red-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Start Your Career Path Today</h2>
          <p className="text-red-100 text-sm mb-8">Apply once. Get connected to training, funding, certification, and employment.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm text-center">
              Apply Now
            </Link>
            <Link href="/check-eligibility" className="border-2 border-white/60 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
              Check Eligibility
            </Link>
          </div>
          <p className="mt-6 text-red-200 text-xs">
            Or call / text{' '}
            <a href="tel:3173143757" className="text-white font-bold underline hover:text-red-100 transition-colors">(317) 314-3757</a>
          </p>
        </div>
      </section>
    </main>
  );
}

