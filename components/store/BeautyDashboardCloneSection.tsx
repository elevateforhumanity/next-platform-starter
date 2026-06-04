'use client';

import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { BEAUTY_PROGRAM_CARDS, BEAUTY_TRIAL_PROGRAMS_PREFILL } from '@/lib/store/beauty-dashboard-clone';

/**
 * Beauty vertical landing — programs list + CTA to canonical /store/plans pricing.
 */
export function BeautyDashboardCloneSection() {
  return (
    <>
      <section className="py-14 px-4 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-3">
            Programs included in your dashboard clone
          </h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Outside organizations get the same admin dashboard experience as Elevate — pre-wired for
            beauty and personal-services training, not a generic empty LMS.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BEAUTY_PROGRAM_CARDS.map((p) => (
              <Link
                key={p.slug}
                href={p.href}
                className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:shadow-md transition"
              >
                <h3 className="font-bold text-slate-900 mb-1">{p.name}</h3>
                <p className="text-sm text-slate-600">{p.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <LayoutDashboard className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Pricing: start at $29/month</h2>
          <p className="text-slate-600 mb-8">
            Use Solo for a single chair or spa, Business for a small team, Professional when you need
            LMS and certificates. Add student management, apprenticeship, and workforce modules only
            when you need them.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/store/plans?vertical=beauty"
              className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-red-700"
            >
              View plans & add-ons
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/store/trial?vertical=beauty"
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-8 py-4 rounded-lg font-bold text-slate-900 hover:bg-slate-50"
            >
              14-day org trial
            </Link>
            <Link
              href="/store/demo/admin"
              className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:underline py-4"
            >
              Preview dashboard demo
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-6">
            Trial prefill programs: {BEAUTY_TRIAL_PROGRAMS_PREFILL}
          </p>
        </div>
      </section>
    </>
  );
}
