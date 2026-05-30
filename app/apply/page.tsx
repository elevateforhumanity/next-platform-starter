import type { Metadata } from 'next';
import Link from 'next/link';
import IntakeFormInner from './IntakeFormInner';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStaticProgram } from '@/data/programs/index';

// No static revalidation — use admin client so all published programs are
// always returned regardless of RLS policy state on the anon key.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply | Check Eligibility for Funded Training',
  description:
    'Check eligibility for WIOA, WRG, and FSSA IMPACT-funded training in healthcare, trades, technology, and business. Many programs are no cost to eligible Indiana residents.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams?: { program?: string; payment?: string };
}) {
  // Note: ?program=barber-apprenticeship is 301'd to /programs/barber-apprenticeship/apply
  // by next.config.mjs before this page renders. No barber-specific branch needed here.
  const programSlug = normalizeProgramInterest(searchParams?.program) ?? '';

  // Resolve a human-readable program name for the hero — try static catalog first,
  // then fall back to slug-to-title formatting so the hero is never blank.
  const staticProg = programSlug ? getStaticProgram(programSlug) : null;
  const programTitle = staticProg?.title
    ?? (programSlug
      ? programSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : '');

  // Use admin client to bypass RLS — programs table public_read policy
  // historically only matched status='active' but published programs use
  // status='published', so the anon key returns an incomplete list.
  const db = await requireAdminClient();
  const { data: programs } = db
    ? await db
        .from('programs')
        .select('id, title, slug')
        .in('status', ['active', 'published'])
        .eq('published', true)
        .order('title')
    : { data: [] };

  return (
    <div className="min-h-screen bg-white">
      {/* Audience switcher */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-slate-900">Applying as:</span>
          <span className="font-bold text-brand-red-600">Student / Participant</span>
          <span className="text-slate-300">|</span>
          <Link href="/onboarding/employer" className="text-slate-500 hover:text-slate-800 transition-colors">Employer</Link>
          <Link href="/apply/program-holder" className="text-slate-500 hover:text-slate-800 transition-colors">Training Provider</Link>
          <Link href="/partners/apply" className="text-slate-500 hover:text-slate-800 transition-colors">Agency / Partner</Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">
            Funding &amp; Apprenticeship Intake
          </p>
          {programTitle ? (
            <>
              <p className="text-slate-400 text-sm mb-1">Applying for:</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                {programTitle}
              </h1>
            </>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Check Your Eligibility
            </h1>
          )}
          <p className="text-slate-300 text-base max-w-xl">
            Takes 3–5 minutes. We screen for WIOA, Workforce Ready Grant, FSSA IMPACT, and
            Job Ready Indy funding — most eligible Indiana residents pay $0.
          </p>
          {programTitle ? (
            <p className="mt-3 text-sm text-slate-400">
              Not the right program?{' '}
              <Link href="/programs" className="text-brand-red-400 hover:text-brand-red-300 underline underline-offset-2">
                Browse all programs
              </Link>
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Still deciding?{' '}
              <Link href="/programs" className="text-brand-red-400 hover:text-brand-red-300 underline underline-offset-2">
                Browse all programs
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="py-10">
        <div className="max-w-2xl mx-auto px-4">
          <IntakeFormInner programs={programs ?? []} />
        </div>
      </section>
    </div>
  );
}
