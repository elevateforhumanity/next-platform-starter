/**
 * HomeHowItWorks
 *
 * Operational continuity flow: Apply → Funding → Training →
 * Apprenticeship → Credential → Employment.
 * Communicates the full pipeline, not just "take a class."
 */

import Link from 'next/link';
import {
  ClipboardList,
  DollarSign,
  BookOpen,
  HardHat,
  Award,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: ClipboardList,
    label: 'Apply',
    detail: 'Complete a short application. No cost, no commitment.',
    href: '/apply',
    color: 'text-brand-red-500',
    bg: 'bg-brand-red-50',
  },
  {
    n: '02',
    icon: DollarSign,
    label: 'Funding Review',
    detail: 'We check WIOA, Workforce Ready Grant, and other sources. Most qualify.',
    href: '/check-eligibility',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    n: '03',
    icon: BookOpen,
    label: 'Training',
    detail: 'Instructor-led, credential-aligned coursework with AI-powered support.',
    href: '/programs',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    n: '04',
    icon: HardHat,
    label: 'Apprenticeship',
    detail: 'DOL-registered OJT with employer partners. Hours tracked, wages paid.',
    href: '/apprenticeships',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    n: '05',
    icon: Award,
    label: 'Credential',
    detail: 'Industry-recognized certification. Publicly verifiable on our platform.',
    href: '/verify',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    n: '06',
    icon: Briefcase,
    label: 'Employment',
    detail: 'Job placement support, employer connections, and career advancement.',
    href: '/employment-support',
    color: 'text-brand-green-600',
    bg: 'bg-brand-green-50',
  },
];

export function HomeHowItWorks() {
  return (
    <section
      className="bg-slate-950 py-16 px-4"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            The Elevate Pathway
          </p>
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-extrabold text-white mb-3"
          >
            One system. End-to-end.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            From first application to first paycheck — every step is tracked, funded, and
            supported. No gaps, no handoffs to nowhere.
          </p>
        </div>

        {/* Step grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.n}
                href={step.href}
                className="group relative flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-0.5"
              >
                {/* Connector line (desktop only) */}
                {i < STEPS.length - 1 && (
                  <span
                    className="hidden lg:block absolute top-8 -right-1.5 z-10 text-slate-700"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}

                <div
                  className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${step.color}`} aria-hidden="true" />
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 mb-0.5">{step.n}</p>
                  <p className="text-xs font-extrabold text-white leading-tight mb-1">
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug hidden sm:block">
                    {step.detail}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            See the full process <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
