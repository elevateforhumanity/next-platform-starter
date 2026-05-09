import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ProgramVideoCards } from '@/components/marketing/ProgramVideoCards';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';

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
  // Preload hero video during HTML parse, before React hydrates.
  // Next.js metadata `other` does not emit <link rel="preload"> — handled
  // via the explicit <link> tag rendered in the page component instead.
};

export default function HomePage() {
  return (
    <main>
      <HomeHeroVideo banner={heroBanners.home} />

      {/* ROLE-BASED ENTRY */}
      <section className="bg-white border-b border-slate-100 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-500 text-sm font-semibold mb-6">Who are you?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "I'm looking for training", sub: 'Student Flow', href: '/apply', color: 'bg-brand-red-600 hover:bg-brand-red-700 text-white' },
              { label: 'I need funding options', sub: 'Funding Flow', href: '/funding', color: 'bg-blue-700 hover:bg-blue-800 text-white' },
              { label: "I'm a workforce case manager", sub: 'Agency Flow', href: '/for-agencies', color: 'bg-slate-800 hover:bg-slate-900 text-white' },
              { label: 'I want to hire or host apprentices', sub: 'Employer Flow', href: '/for-employers', color: 'bg-green-700 hover:bg-green-800 text-white' },
              { label: "I'm a training provider", sub: 'Partner Flow', href: '/training-providers', color: 'bg-purple-700 hover:bg-purple-800 text-white' },
            ].map((r) => (
              <Link key={r.href} href={r.href} className={`${r.color} rounded-xl px-4 py-4 flex flex-col gap-1 transition-colors text-center`}>
                <span className="font-bold text-sm leading-snug">{r.label}</span>
                <span className="text-xs opacity-75">{r.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 6-step summary strip */}
      <section className="bg-slate-900 border-t border-slate-800 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest text-center mb-6">
            How It Works
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { n: '1', label: 'Apply' },
              { n: '2', label: 'Get Approved for Funding' },
              { n: '3', label: 'Get Placed in a Program' },
              { n: '4', label: 'Complete Training' },
              { n: '5', label: 'Test & Get Certified' },
              { n: '6', label: 'Get Placed into Employment' },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-2">
                <span className="w-9 h-9 rounded-full bg-brand-red-600 text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <p className="text-slate-300 text-xs font-semibold leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/how-it-works"
              className="inline-block border border-white/30 text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              View Full Process →
            </Link>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">
            Training Programs
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-2">
            Pick a career. Start in weeks.
          </h2>
          <p className="text-slate-500 text-sm text-center mb-10 max-w-xl mx-auto">
            Healthcare, skilled trades, CDL, cosmetology, and more — each with a real credential at
            the end.
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

      {/* PHOTO STRIP */}
      <section className="grid grid-cols-3 h-56 sm:h-80 overflow-hidden">
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

      {/* FUNDING — light bg, no more dark blue-on-blue */}
      <section className="bg-slate-50 py-16 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center gap-12">
          <div className="flex-1">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">
              Funding
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
              Most students pay $0.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg">
              WIOA, Workforce Ready Grant, and FSSA IMPACT funding covers tuition, books, and exam
              fees for eligible Indiana residents. Check in two minutes — no commitment.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['WIOA', 'Workforce Ready Grant', 'FSSA IMPACT', 'Job Ready Indy'].map((f) => (
                <span
                  key={f}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full"
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
          <div className="relative w-full lg:w-96 h-64 lg:h-72 rounded-2xl overflow-hidden shrink-0">
            <Image
              src="/images/pages/comp-home-pathways-support.jpg"
              alt="Funding support advisor"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 384px"
            />
          </div>
        </div>
      </section>

      {/* WHO WE SERVE — image cards */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">
            Who We Serve
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Built for everyone in the workforce ecosystem.
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                label: 'Learners',
                desc: 'Get trained, credentialed, and placed — often at no cost.',
                href: '/apply',
                cta: 'Apply Now',
                img: '/images/pages/for-students-hero.jpg',
                alt: 'Student in training',
              },
              {
                label: 'Workforce Agencies',
                desc: 'Refer participants, track WIOA outcomes, and document compliance.',
                href: '/agencies',
                cta: 'Agency Info',
                img: '/images/pages/about-career-pathways.jpg',
                alt: 'Workforce agency advisor',
              },
              {
                label: 'Employers',
                desc: 'Hire trained graduates and access OJT wage reimbursement.',
                href: '/for-employers',
                cta: 'Employer Info',
                img: '/images/pages/hire-graduates-page-1.jpg',
                alt: 'Employer hiring graduates',
              },
            ].map((b) => (
              <div
                key={b.label}
                className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col"
              >
                <div className="relative h-44 w-full">
                  <Image
                    src={b.img}
                    alt={b.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{b.label}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">{b.desc}</p>
                  <Link
                    href={b.href}
                    className="text-brand-red-600 hover:text-brand-red-700 text-sm font-bold transition-colors"
                  >
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
            { stat: '94%', label: 'Credential attainment rate' },
            { stat: '$0', label: 'Cost for eligible students' },
            { stat: '30+', label: 'Programs available' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{item.stat}</p>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <p className="max-w-5xl mx-auto mt-6 text-center text-slate-500 text-xs leading-relaxed px-4">
          * Figures are estimates based on internal participant and credential records. Eligibility and outcomes vary by program and funding source. See our{' '}
          <Link href="/impact/methodology" className="underline hover:text-slate-300 transition-colors">
            impact methodology
          </Link>
          .
        </p>
      </section>

      {/* FULL-WIDTH IMAGE BREAK */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <Image
          src="/images/pages/career-services-hero.jpg"
          alt="Elevate for Humanity career services"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
          <p className="text-white text-xl sm:text-3xl font-extrabold text-center px-6 drop-shadow-lg">
            Real credentials. Real jobs. Real lives changed.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <section className="bg-brand-red-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Start Your Career Path Today</h2>
          <p className="text-red-100 text-sm mb-8">
            Apply once. Get connected to training, funding, certification, and employment.
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
            <a
              href="tel:3173143757"
              className="text-white font-bold underline hover:text-red-100 transition-colors"
            >
              (317) 314-3757
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
