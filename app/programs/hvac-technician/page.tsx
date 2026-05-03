import { getEnrollmentCount } from '@/lib/programs/getEnrollmentCount';

import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CheckCircle, CreditCard } from 'lucide-react';
import { getPublishedProgramBySlug, formatTrackCost } from '@/lib/programs/getProgramBySlug';
import { ProgramComingSoon } from '@/components/programs/ProgramComingSoon';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const revalidate = 0; // force fresh — bust stale SSG output
export const maxDuration = 20; // Netlify Pro allows up to 26s; stay under

export async function generateMetadata(): Promise<Metadata> {
  try {
    const p = await getPublishedProgramBySlug('hvac-technician');
    return {
      title: `${p.title} | EPA 608 Proctor Site | Indianapolis`,
      description: p.short_description ?? p.description ?? undefined,
      alternates: { canonical: '/programs/hvac-technician' },
      openGraph: {
        title: p.hero_headline ?? p.title,
        description: p.hero_subheadline ?? p.short_description ?? undefined,
        type: 'website',
        url: 'https://www.elevateforhumanity.org/programs/hvac-technician',
      },
    };
  } catch {
    return {
      title: 'HVAC Technician Training | EPA 608 Proctor Site | Indianapolis',
      description:
        '12-week HVAC program in Indianapolis, Indiana. EPA 608 Universal proctored on-site. WIOA and WRG funding available for eligible Indiana residents.',
      alternates: { canonical: '/programs/hvac-technician' },
    };
  }
}

const WEEKLY_CURRICULUM = [
  {
    weeks: 'Week 1–2',
    topic: 'HVAC Fundamentals',
    detail: 'How heating and cooling systems work. Tools, safety, and industry standards.',
  },
  {
    weeks: 'Week 3–4',
    topic: 'Electrical Systems',
    detail: 'Wiring, circuits, controls, and electrical diagnostics on real equipment.',
  },
  {
    weeks: 'Week 5–6',
    topic: 'Refrigeration Cycle',
    detail: 'Refrigerant handling, pressure-temperature relationships, EPA 608 core concepts.',
  },
  {
    weeks: 'Week 7–8',
    topic: 'System Installation & Repair',
    detail: 'AC units, furnaces, heat pumps — install, troubleshoot, and repair.',
  },
  {
    weeks: 'Week 9–10',
    topic: 'Advanced Diagnostics',
    detail: 'Fault isolation, system performance testing, and customer communication.',
  },
  {
    weeks: 'Week 11',
    topic: 'EPA 608 Exam Prep',
    detail: 'Proctored practice exams. Core, Type I, II, III, and Universal certification prep.',
  },
  {
    weeks: 'Week 12',
    topic: 'Career Readiness',
    detail: 'Resume, job placement support, employer introductions, and certification wrap-up.',
  },
];

const OUTCOMES = [
  { role: 'HVAC Helper / Installer', pay: '$18–$22/hr', timeline: 'Day 1 after cert' },
  { role: 'HVAC Technician', pay: '$22–$30/hr', timeline: '6–12 months' },
  { role: 'Senior Tech / Lead', pay: '$30–$40/hr', timeline: '2–3 years' },
  { role: 'Business Owner', pay: '$60K–$100K+', timeline: '3–5 years' },
];

const AUTHORITY = [
  'EPA 608 Universal — proctored on-site',
  'OSHA 10 — nationally recognized safety cert',
  'State-recognized workforce training provider',
  'WIOA & Workforce Ready Grant approved',
  'CPR / First Aid certification',
];

export default async function HVACTechnicianPage() {
  const enrollmentCount = await getEnrollmentCount('hvac-technician');
  let program;
  try {
    program = await getPublishedProgramBySlug('hvac-technician');
  } catch {
    // DB row missing or unpublished — render static page from heroBanners config.
    // Apply migration 20260603000003_publish_hvac_program.sql to fix the DB state.
    program = null;
  }

  // Do not gate on isComplete — HVAC has a full static fallback and is always live.
  // ProgramComingSoon is reserved for programs with no static content at all.

  const banner = heroBanners['hvac-technician'];

  // DB row missing — render full static page so the page is never sparse.
  // Fix: apply migration 20260603000003_publish_hvac_program.sql in Supabase Dashboard.
  if (!program) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeroVideo
          videoSrcDesktop={banner.videoSrcDesktop}
          posterImage={banner.posterImage}
          voiceoverSrc={banner.voiceoverSrc}
          microLabel={banner.microLabel}
          analyticsName={banner.analyticsName}
        />

        {/* Funding bar */}
        <section className="bg-brand-orange-600 text-white py-5 px-6 text-center">
          <p className="text-lg font-bold tracking-tight">
            This program may cost you <span className="underline decoration-wavy">$0</span> — WIOA
            and Workforce Ready Grant funding available for eligible Indiana residents.
          </p>
          <p className="text-sm mt-1 text-orange-100">
            Check your eligibility in 2 minutes. No commitment required.
          </p>
        </section>

        {/* Program identity + CTAs */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-black">
              12-Week Workforce Training Program
            </p>
            <h1 className="text-4xl font-black text-slate-900 mb-4">{banner.belowHeroHeadline}</h1>
            {enrollmentCount > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                {enrollmentCount.toLocaleString()} learners currently enrolled
              </p>
            )}
            <p className="text-black text-lg mb-6">{banner.belowHeroSubheadline}</p>
            <p className="mt-2 text-xl text-slate-700 leading-relaxed mb-8">
              You could be earning{' '}
              <strong className="text-slate-900">$18–$25/hr fixing AC units</strong> 90 days from
              now — with certifications that follow you for life.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={banner.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold px-6 py-3 transition-colors"
              >
                {banner.primaryCta.label}
              </a>
              {banner.secondaryCta && (
                <a
                  href={banner.secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold px-6 py-3 transition-colors"
                >
                  {banner.secondaryCta.label}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Authority strip */}
        <section className="bg-slate-900 text-white py-8 px-6">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-black mb-4 text-center">
              What you earn when you complete this program
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {AUTHORITY.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-white">
                  <span className="text-brand-orange-400 mt-0.5 shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Weekly curriculum — collapsed by default */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none mb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-600 mb-2">
                  Week by week
                </p>
                <h2 className="text-3xl font-bold">What You&apos;ll Learn</h2>
                <p className="mt-2 text-black">
                  No fluff. Every week builds toward a job-ready skill set.
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand-orange-600 border border-brand-orange-300 rounded-lg px-4 py-1.5 group-open:hidden ml-6">
                Show curriculum ↓
              </span>
              <span className="shrink-0 text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg px-4 py-1.5 hidden group-open:inline ml-6">
                Collapse ↑
              </span>
            </summary>
            <div className="grid md:grid-cols-2 gap-4">
              {WEEKLY_CURRICULUM.map((item, i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                  <div className="shrink-0 w-20 text-xs font-bold text-brand-orange-600 uppercase tracking-wide pt-0.5">
                    {item.weeks}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.topic}</p>
                    <p className="text-sm text-black mt-1">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </section>

        {/* Career outcomes */}
        <section className="bg-slate-50 border-y border-slate-200 py-16 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-600 mb-2">
                Career pathway
              </p>
              <h2 className="text-3xl font-bold">Training → Job → Money</h2>
              <p className="mt-2 text-black">
                HVAC is one of the highest-demand trades in Indiana. Here&apos;s where this program
                takes you.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OUTCOMES.map((o, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-black mb-2">
                    {o.timeline}
                  </p>
                  <p className="font-bold text-slate-900 text-lg">{o.role}</p>
                  <p className="text-2xl font-black text-brand-orange-600 mt-1">{o.pay}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-slate-200 bg-slate-900 text-white py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-400 mb-3">
              Ready to start?
            </p>
            <h2 className="text-3xl font-bold">This could cost you $0.</h2>
            <p className="mt-4 text-white text-lg">
              WIOA and Workforce Ready Grant funding covers tuition for eligible Indiana residents.
              EPA 608 Universal certification proctored on-site. Most students pay nothing.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={banner.primaryCta.href}
                className="rounded-xl bg-brand-orange-600 px-6 py-3 font-semibold text-white hover:bg-brand-orange-700 transition-colors"
              >
                {banner.primaryCta.label}
              </a>
              {banner.secondaryCta && (
                <a
                  href={banner.secondaryCta.href}
                  className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  {banner.secondaryCta.label}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const hero =
    program.program_media.find((m) => m.media_type === 'hero_image') ?? program.program_media[0];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero video */}
      <HeroVideo
        videoSrcDesktop={banner.videoSrcDesktop}
        posterImage={banner.posterImage}
        voiceoverSrc={banner.voiceoverSrc}
        microLabel={banner.microLabel}
        analyticsName={banner.analyticsName}
      />

      {/* FUNDING HEADLINE — lead with the strongest weapon */}
      <section className="bg-brand-orange-600 text-white py-5 px-6 text-center">
        <p className="text-lg font-bold tracking-tight">
          This program may cost you <span className="underline decoration-wavy">$0</span> — WIOA and
          Workforce Ready Grant funding available for eligible Indiana residents.
        </p>
        <p className="text-sm mt-1 text-orange-100">
          Check your eligibility in 2 minutes. No commitment required.
        </p>
      </section>

      {/* Program identity + CTAs */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-black">
              12-Week Workforce Training Program
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {program.hero_headline ?? program.title}
            </h1>
            {/* Emotional hook */}
            <p className="mt-4 text-xl text-black leading-relaxed">
              You could be earning{' '}
              <strong className="text-slate-900">$18–$25/hr fixing AC units</strong> 90 days from
              now — with certifications that follow you for life.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {program.program_ctas.map((cta) => {
                const base =
                  'inline-flex items-center rounded-xl px-5 py-3 font-semibold transition-colors';
                const variant =
                  cta.style_variant === 'primary'
                    ? `${base} bg-slate-900 text-white hover:bg-slate-800`
                    : cta.style_variant === 'secondary'
                      ? `${base} border border-slate-300 text-slate-900 hover:bg-slate-50`
                      : `${base} border border-slate-200 text-black hover:bg-slate-50`;
                if (cta.is_external) {
                  return (
                    <a
                      key={cta.id}
                      href={cta.href}
                      target="_blank"
                      rel="noreferrer"
                      className={variant}
                    >
                      {cta.label}
                    </a>
                  );
                }
                return (
                  <Link key={cta.id} href={cta.href} className={variant}>
                    {cta.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-black">
              {program.length_weeks && <span>⏱ {program.length_weeks} weeks</span>}
              {program.delivery_model && (
                <span className="capitalize">📍 {program.delivery_model}</span>
              )}
              {program.certificate_title && <span>🎓 {program.certificate_title}</span>}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              {hero?.url ? (
                <Image
                  src={hero.url}
                  alt={hero.alt_text ?? program.title}
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <Image
                  src="/images/pages/programs-hvac-course-hero.jpg"
                  alt="HVAC technician training"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Authority stacking */}
      <section className="bg-slate-900 text-white py-8 px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-black mb-4 text-center">
            What you earn when you complete this program
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {AUTHORITY.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white">
                <span className="text-brand-orange-400 mt-0.5 shrink-0">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll learn — weekly breakdown, collapsed by default */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-600 mb-2">
                Week by week
              </p>
              <h2 className="text-3xl font-bold">What You&apos;ll Learn</h2>
              <p className="mt-2 text-black">
                No fluff. Every week builds toward a job-ready skill set.
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-brand-orange-600 border border-brand-orange-300 rounded-lg px-4 py-1.5 group-open:hidden ml-6">
              Show curriculum ↓
            </span>
            <span className="shrink-0 text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg px-4 py-1.5 hidden group-open:inline ml-6">
              Collapse ↑
            </span>
          </summary>
          <div className="grid md:grid-cols-2 gap-4">
            {WEEKLY_CURRICULUM.map((item, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                <div className="shrink-0 w-20 text-xs font-bold text-brand-orange-600 uppercase tracking-wide pt-0.5">
                  {item.weeks}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.topic}</p>
                  <p className="text-sm text-black mt-1">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* Outcome clarity — training → job → money */}
      <section className="bg-slate-50 border-y border-slate-200 py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-600 mb-2">
              Career pathway
            </p>
            <h2 className="text-3xl font-bold">Training → Job → Money</h2>
            <p className="mt-2 text-black">
              HVAC is one of the highest-demand trades in Indiana. Here&apos;s where this program
              takes you.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OUTCOMES.map((o, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-black mb-2">
                  {o.timeline}
                </p>
                <p className="font-bold text-slate-900 text-lg">{o.role}</p>
                <p className="text-2xl font-black text-brand-orange-600 mt-1">{o.pay}</p>
              </div>
            ))}
          </div>
          {program.outcomes && (
            <p className="mt-6 text-sm text-black max-w-2xl">{program.outcomes}</p>
          )}
        </div>
      </section>

      {/* About + Enrollment tracks */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,0.9fr]">
          <div>
            <h2 className="text-2xl font-bold">About This Program</h2>
            {program.description && (
              <p className="mt-4 text-slate-700 leading-relaxed">{program.description}</p>
            )}
            {program.requirements && (
              <>
                <h3 className="mt-8 text-xl font-semibold">Requirements</h3>
                {Array.isArray(program.requirements) ? (
                  <ul className="mt-3 space-y-2">
                    {(program.requirements as string[]).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-slate-700">{String(program.requirements)}</p>
                )}
              </>
            )}
          </div>

          <aside className="self-start rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold">Enrollment Options</h2>
            <div className="mt-4 space-y-4">
              {program.program_tracks.filter((t) => t.available).length > 0 ? (
                program.program_tracks
                  .filter((t) => t.available)
                  .map((track) => (
                    <div key={track.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-slate-900">{track.title}</h3>
                        <span className="shrink-0 text-sm font-semibold text-slate-700">
                          {formatTrackCost(track.cost_cents)}
                        </span>
                      </div>
                      {track.description && (
                        <p className="mt-2 text-sm text-black">{track.description}</p>
                      )}
                    </div>
                  ))
              ) : (
                /* Static self-pay fallback when DB tracks are not yet configured */
                <>
                  <div className="rounded-xl border-2 border-brand-orange-500 bg-orange-50 p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-slate-900">WIOA / Funded Track</h3>
                      <span className="shrink-0 text-sm font-bold text-brand-orange-600">$0</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      Eligible Indiana residents pay nothing. WIOA and Workforce Ready Grant cover
                      full tuition.
                    </p>
                    <Link
                      href="/check-eligibility"
                      className="block text-center bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      Check My Eligibility
                    </Link>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-slate-900">Self-Pay</h3>
                      <span className="shrink-0 text-sm font-semibold text-slate-700">$2,495</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      Pay out of pocket. Payment plans available. Includes all materials and EPA 608
                      exam fee.
                    </p>
                    <Link
                      href="/apply?program=hvac-technician&track=self-pay"
                      className="block text-center border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      Apply — Self-Pay
                    </Link>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-slate-900">Payment Plan</h3>
                      <span className="shrink-0 text-sm font-semibold text-slate-700">$249/mo</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      Split tuition into 10 monthly payments. No interest. Start training
                      immediately.
                    </p>
                    <Link
                      href="/apply?program=hvac-technician&track=payment-plan"
                      className="block text-center border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      Apply — Payment Plan
                    </Link>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Curriculum modules — collapsed by default, expandable */}
      {program.program_modules.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none mb-4">
              <h2 className="text-2xl font-bold">Full Curriculum</h2>
              <span className="text-sm font-semibold text-brand-orange-600 border border-brand-orange-300 rounded-lg px-4 py-1.5 group-open:hidden">
                Show {program.program_modules.length} modules ↓
              </span>
              <span className="text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg px-4 py-1.5 hidden group-open:inline">
                Collapse ↑
              </span>
            </summary>
            <div className="space-y-4">
              {program.program_modules.map((mod) => (
                <div key={mod.id} className="overflow-hidden rounded-2xl border border-slate-200">
                  <details className="group/mod">
                    <summary className="border-b border-slate-200 bg-slate-50 px-6 py-4 cursor-pointer list-none">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                            Module {mod.module_number}
                          </p>
                          <h3 className="text-lg font-semibold text-slate-900">{mod.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-black">
                          {mod.lesson_count} lessons
                          {mod.duration_hours ? ` · ${mod.duration_hours}h` : ''}
                          <span className="text-slate-400 group-open/mod:hidden">▸</span>
                          <span className="text-slate-400 hidden group-open/mod:inline">▾</span>
                        </div>
                      </div>
                      {mod.description && (
                        <p className="mt-2 text-sm text-black">{mod.description}</p>
                      )}
                    </summary>
                    {mod.program_lessons?.length > 0 && (
                      <ol className="divide-y divide-slate-100">
                        {mod.program_lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between gap-4 px-6 py-3"
                          >
                            <span className="text-sm text-slate-800">
                              {lesson.lesson_number}. {lesson.title}
                            </span>
                            <span className="shrink-0 text-xs uppercase tracking-wide text-black">
                              {lesson.lesson_type}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </details>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      {/* Program Resources */}
      <section className="border-t border-slate-200 bg-slate-50 py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Program Resources</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                href: '/programs/hvac-technician/study-guide',
                label: 'EPA 608 Study Guide',
                desc: 'Full exam prep — Core, Type I, II, III',
              },
              {
                href: '/verify-credentials',
                label: 'Credentials & Standards',
                desc: 'Competency framework and checksheets',
              },
              {
                href: '/federal-compliance',
                label: 'HVAC Standards',
                desc: 'Domain codes, hours, lesson map',
              },
              {
                href: '/federal-compliance',
                label: 'OJT Checksheets',
                desc: 'Skill verification forms',
              },
            ].map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-orange-400 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-slate-900 text-sm">{label}</p>
                <p className="text-xs text-black mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EPA 608 Online Enrollment */}
      <section className="border-t border-slate-200 bg-white py-14 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-orange-600 mb-2">
              EPA 608 Certification
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              EPA 608 Universal — proctored on-site
            </h2>
            <p className="text-slate-600 max-w-2xl">
              The EPA 608 Universal exam is proctored on-site at our Indianapolis training center as
              part of the HVAC Technician program. Students who complete the program are prepared
              and scheduled for the exam before graduation.
            </p>
            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/programs/hvac-technician/apply"
                  className="inline-block bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
                >
                  Enroll Now
                </Link>
                <Link
                  href="/programs/hvac-technician/inquiry"
                  className="inline-block border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
                >
                  Request Information
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-slate-200 bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-orange-400 mb-3">
            Ready to start?
          </p>
          <h2 className="text-3xl font-bold">This could cost you $0.</h2>
          <p className="mt-4 text-white text-lg">
            WIOA and Workforce Ready Grant funding covers tuition for eligible Indiana residents.
            EPA 608 Universal certification proctored on-site. Most students pay nothing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/programs/hvac-technician/apply"
              className="rounded-xl bg-brand-orange-600 px-8 py-3.5 font-bold text-white hover:bg-brand-orange-700 transition-colors"
            >
              Enroll Now
            </Link>
            <Link
              href="/programs/hvac-technician/inquiry"
              className="rounded-xl border border-slate-600 px-8 py-3.5 font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Request Information
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
