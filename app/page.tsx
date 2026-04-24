
import Link from 'next/link';
import type { Metadata } from 'next';
import MarqueeBanner from '@/components/MarqueeBanner';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import RotatingBanner from '@/components/blocks/RotatingBanner';
import { WorkforceSystemDiagram } from '@/components/marketing/WorkforceSystemDiagram';


export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Operating System — Indianapolis, Indiana',
  description: 'DOL-registered apprenticeship sponsor and ETPL-approved training provider. Credentialing, compliance tracking, employer placement, and WIOA-ready reporting — built for Indiana workforce agencies and participants.',
  keywords: 'workforce operating system Indianapolis, WIOA training Indiana, DOL registered apprenticeship, ETPL approved training provider, workforce compliance tracking, Elevate for Humanity',
  openGraph: {
    title: 'Elevate for Humanity | Workforce Operating System — Indianapolis, Indiana',
    description: 'Training, credentialing, compliance tracking, and employer placement — built for workforce agencies, employers, and the people they serve.',
  },
};

export default function HomePage() {
  return (
    <main>

      {/* HERO */}
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

      {/* ROTATING BANNER */}
      <RotatingBanner
        variant="red"
        lines={[
          'DOL Registered Apprenticeship Sponsor — Indiana',
          'WIOA & Workforce Ready Grant funding available',
          'ETPL-approved training provider',
          'Compliance-ready reporting for workforce agencies',
          'Employer placement tracking built in',
          'Credentials that meet DOL and industry standards',
        ]}
      />

      {/* MARQUEE */}
      <MarqueeBanner />

      {/* PLATFORM POSITIONING */}
      <section className="bg-slate-950 py-16 px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest text-center mb-3">What we actually built</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-4">
            More than a training provider.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base text-center max-w-2xl mx-auto mb-12">
            Elevate runs the full workforce cycle — from intake and funding documentation to credentialing, employer placement, and compliance reporting. One system. Every stakeholder.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🎓',
                title: 'Credential Delivery',
                body: 'Industry-recognized credentials with a built-in LMS, checkpoint gating, and certificate issuance.',
              },
              {
                icon: '📋',
                title: 'Compliance Tracking',
                body: 'WIOA documentation, FERPA controls, audit logs, and eligibility verification — all in one place.',
              },
              {
                icon: '🏢',
                title: 'Employer Pipeline',
                body: 'Employer dashboards, OJT and WEX tracking, apprenticeship management, and placement reporting.',
              },
              {
                icon: '💰',
                title: 'Funding Infrastructure',
                body: 'WIOA, Workforce Ready Grant, FSSA IMPACT, and Job Ready Indy — documented and tracked automatically.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-white font-bold text-sm mb-2">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/for-agencies" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm mr-4">
              How It Works for Agencies
            </Link>
            <Link href="/program-holder" className="inline-block border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
              License the Platform
            </Link>
          </div>
        </div>
      </section>

      {/* SYSTEM DIAGRAM */}
      <WorkforceSystemDiagram />

      {/* WHO THIS IS FOR */}
      <section className="bg-white py-16 px-6 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 text-center">Who we work with</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Learners',
                desc: 'Get trained, credentialed, and placed in a job — often at no cost through WIOA or state funding.',
                href: '/apply',
                cta: 'Apply Now',
                ctaClass: 'bg-brand-red-600 hover:bg-brand-red-700',
                accent: 'border-slate-900',
              },
              {
                label: 'Workforce Agencies',
                desc: 'Refer participants, track outcomes, and document WIOA compliance through a single system.',
                href: '/for-agencies',
                cta: 'Agency Info',
                ctaClass: 'bg-brand-red-600 hover:bg-brand-red-700',
                accent: 'border-brand-red-500',
              },
              {
                label: 'Employers',
                desc: 'Hire trained graduates, sponsor registered apprentices, and access OJT wage reimbursement.',
                href: '/for-employers',
                cta: 'Employer Info',
                ctaClass: 'bg-brand-red-600 hover:bg-brand-red-700',
                accent: 'border-brand-red-500',
              },
              {
                label: 'Program Holders',
                desc: 'Deliver programs on Elevate infrastructure — LMS, compliance tracking, credentialing, and payments.',
                href: '/program-holder',
                cta: 'Partner With Us',
                ctaClass: 'bg-brand-red-600 hover:bg-brand-red-700',
                accent: 'border-brand-red-500',
              },
            ].map((b) => (
              <div key={b.label} className={`bg-white border border-slate-200 border-t-4 ${b.accent} rounded-xl shadow-sm p-6 flex flex-col`}>
                <h3 className="text-base font-bold text-slate-900 mb-2">{b.label}</h3>
                <p className="text-sm text-slate-800 leading-relaxed flex-1 mb-5">{b.desc}</p>
                <Link href={b.href} className={`${b.ctaClass} text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center transition-colors`}>
                  {b.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 text-center">Programs</h2>
          <p className="text-white/70 text-sm text-center mb-10 max-w-xl mx-auto">
            Healthcare, skilled trades, CDL, technology, cosmetology, and more — each with a clear credential outcome.
          </p>
          <ProgramVideoCards />
          <div className="mt-10 text-center">
            <Link href="/programs" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* FUNDING */}
      <section className="bg-brand-red-700 py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="w-full lg:max-w-2xl">
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-3">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Workforce funding available for eligible programs</h2>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6">
                Many of our programs qualify for federal and Indiana state workforce funding. Eligibility depends on the program, your background, and current funding availability. Check before you apply — it takes two minutes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'WIOA',                  tag: 'Federal',       desc: 'For adults, dislocated workers, and youth 16–24. Covers eligible high-demand programs.' },
                  { label: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Covers tuition for high-demand certification programs on the INDemand list.' },
                  { label: 'FSSA IMPACT',           tag: 'Indiana State', desc: 'Pays for training at no cost to current SNAP or TANF recipients. Elevate is a participating training provider.' },
                  { label: 'Job Ready Indy',        tag: 'Indianapolis',  desc: 'For justice-involved individuals and employer OJT partnerships.' },
                ].map((f) => (
                  <div key={f.label} className="bg-white rounded-xl p-4">
                    <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                    <h3 className="text-slate-900 font-bold text-sm mb-1">{f.label}</h3>
                    <p className="text-slate-800 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/check-eligibility" className="inline-block bg-white text-brand-red-700 font-bold px-6 sm:px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors text-sm sm:text-base">
                Check My Eligibility
              </Link>
            </div>
            <div className="lg:flex-shrink-0 bg-white rounded-2xl p-8 text-center lg:w-64">
              <p className="text-4xl font-black text-brand-red-600 mb-2">Funded</p>
              <p className="text-slate-800 text-sm font-semibold mb-4">for eligible participants</p>
              <p className="text-slate-700 text-xs leading-relaxed">Funding covers tuition, books, tools, and exam fees for qualifying programs. Not all programs qualify — check eligibility first.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-slate-800 py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to start?</h2>
          <p className="text-white/70 text-sm mb-8">
            Apply online, check your funding eligibility, or call us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm text-center">
              Apply Now
            </Link>
            <Link href="/check-eligibility" className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">
              Check Eligibility
            </Link>
          </div>
          <p className="mt-6 text-white/50 text-xs">
            Or call / text{' '}
            <a href="tel:3173143757" className="text-white/80 font-bold underline hover:text-brand-red-300 transition-colors">(317) 314-3757</a>
          </p>
        </div>
      </div>

    </main>
  );
}
