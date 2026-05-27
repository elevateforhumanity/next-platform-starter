/**
 * HomeApprenticeshipInfra
 *
 * Communicates the apprenticeship + employer infrastructure in human language.
 * Shows RAPIDS tracking, OJT oversight, employer dashboards — framed as
 * "what this means for you" not "look at our tech stack."
 */

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, ArrowRight } from 'lucide-react';

const EMPLOYER_CAPABILITIES = [
  'DOL-registered apprenticeship sponsorship',
  'OJT wage reimbursement up to 50%',
  'RAPIDS-compatible hour tracking',
  'Employer dashboard with live cohort visibility',
  'WEX and OJT agreement management',
  'WOTC tax credit documentation',
  'Compliance reporting for workforce boards',
];

const LEARNER_CAPABILITIES = [
  'Earn wages while you train',
  'Hours tracked automatically — no paperwork',
  'Geofenced check-in at employer sites',
  'Apprenticeship progress visible in your portal',
  'Credential issued on completion, publicly verifiable',
  'Pathway to journeyman status and wage increases',
];

export function HomeApprenticeshipInfra() {
  return (
    <section
      className="bg-slate-50 py-16 px-4 border-t border-slate-100"
      aria-labelledby="apprenticeship-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">
            Apprenticeship Infrastructure
          </p>
          <h2
            id="apprenticeship-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3"
          >
            Real apprenticeships. Real oversight.
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
            Elevate is a DOL-registered apprenticeship sponsor. That means structured OJT,
            employer coordination, RAPIDS-compatible tracking, and compliance documentation —
            all managed so employers and learners can focus on the work.
          </p>
        </div>

        {/* Two-column: learner + employer */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Learner side */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <span className="text-lg" aria-hidden="true">🎓</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">For Learners</p>
                <h3 className="text-base font-extrabold text-slate-900">Earn while you learn</h3>
              </div>
            </div>
            <ul className="space-y-2.5" role="list">
              {LEARNER_CAPABILITIES.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle
                    className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/apprenticeships"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-brand-red-600 hover:text-brand-red-700 transition-colors"
            >
              Explore apprenticeship programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Employer side */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="text-lg" aria-hidden="true">🏢</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">For Employers</p>
                <h3 className="text-base font-extrabold text-slate-900">Hire, train, retain</h3>
              </div>
            </div>
            <ul className="space-y-2.5" role="list">
              {EMPLOYER_CAPABILITIES.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle
                    className="w-4 h-4 text-blue-600 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/for-employers"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-brand-red-600 hover:text-brand-red-700 transition-colors"
            >
              Employer partnership info <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Photo + stat strip */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="relative h-56 sm:h-72 w-full">
            <Image
              src="/images/pages/apprenticeships-page-1.webp"
              alt="Apprentice working on-site with employer supervisor"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1152px"
              loading="lazy"
              placeholder="empty"
            />
            <div className="absolute inset-0 bg-slate-900/55" />
          </div>
          <div className="absolute inset-0 flex items-center px-8 sm:px-12">
            <div className="max-w-lg">
              <p className="text-white text-lg sm:text-2xl font-extrabold leading-snug mb-3">
                Apprenticeship isn&apos;t a program add-on.
                <br />
                It&apos;s the pathway.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">
                Structured OJT, employer coordination, and RAPIDS-compatible reporting — built
                into every eligible program from day one.
              </p>
              <Link
                href="/apprenticeship-sponsor"
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                About our apprenticeship program <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
