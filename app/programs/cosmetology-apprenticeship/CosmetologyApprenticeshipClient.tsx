'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, Users, MapPin, Award } from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { TUITION_DOLLARS } from '@/lib/cosmetology/pricing';

interface Props {
  program: ProgramSchema;
  enrollmentCount?: number;
}

export default function CosmetologyApprenticeshipClient({ program: p, enrollmentCount = 0 }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-brand-blue-900 to-brand-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <nav className="flex items-center gap-1.5 text-xs text-blue-200 mb-6 justify-center">
            <Link href="/programs" className="hover:text-white">Programs</Link>
            <span>/</span>
            <span className="text-white font-medium">{p.title}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{p.title}</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{p.subtitle}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/programs/cosmetology-apprenticeship/apply"
              className="inline-block px-8 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/contact?program=cosmetology-apprenticeship"
              className="inline-block px-8 py-3 bg-white text-brand-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Request Information
            </Link>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{p.durationWeeks} weeks</div>
              <div className="text-xs text-slate-500">Duration</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">In-Person</div>
              <div className="text-xs text-slate-500">Licensed Indiana salons</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{p.credentials.length} credentials</div>
              <div className="text-xs text-slate-500">Earned on completion</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {enrollmentCount > 0 ? `${enrollmentCount} active` : 'Enrolling now'}
              </div>
              <div className="text-xs text-slate-500">Apprentices</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Tuition + program summary */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">${TUITION_DOLLARS.toLocaleString()}</div>
            <div className="text-slate-600 font-medium">Total Tuition</div>
            <div className="text-sm text-slate-500 mt-2">{p.fundingStatement}</div>
            <Link
              href="/programs/cosmetology-apprenticeship/payment/bnpl"
              className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline"
            >
              View payment plan options →
            </Link>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">{p.durationWeeks} wks</div>
            <div className="text-slate-600 font-medium">Program Duration</div>
            <div className="text-sm text-slate-500 mt-2">{p.schedule}</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">Indiana</div>
            <div className="text-slate-600 font-medium">DOL Registered</div>
            <div className="text-sm text-slate-500 mt-2">WIOA supportive services eligible</div>
          </div>
        </div>

        {/* Training phases accordion */}
        {p.trainingPhases && p.trainingPhases.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Training Phases</h2>
            <div className="space-y-4">
              {p.trainingPhases.map((phase) => {
                const id = `phase-${phase.phase}`;
                return (
                  <div key={id} className="border border-slate-200 rounded-lg">
                    <button
                      onClick={() => toggle(id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
                    >
                      <div>
                        <span className="inline-block text-xs font-bold text-white bg-brand-red-600 rounded-full px-2 py-0.5 mr-2">
                          Phase {phase.phase}
                        </span>
                        <span className="font-semibold text-slate-900">{phase.title}</span>
                        <span className="ml-2 text-sm text-slate-500">— {phase.weeks}</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                          expandedSection === id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSection === id && (
                      <div className="border-t border-slate-200 p-4 bg-slate-50">
                        <p className="text-slate-600 mb-3">{phase.focus}</p>
                        {phase.labCompetencies && phase.labCompetencies.length > 0 && (
                          <ul className="space-y-1">
                            {phase.labCompetencies.map((comp) => (
                              <li key={comp} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                                {comp}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Curriculum areas */}
        {p.curriculum && p.curriculum.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Curriculum Areas</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {p.curriculum.map((area) => (
                <div key={area.title} className="border border-slate-200 rounded-lg p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">{area.title}</h3>
                  <ul className="space-y-1">
                    {area.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credentials earned */}
        {p.credentials.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Credentials You Earn</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {p.credentials.map((cred) => (
                <div key={cred.name} className="border border-slate-200 rounded-lg p-5">
                  <Award className="w-6 h-6 text-brand-red-600 mb-3" />
                  <div className="font-semibold text-slate-900 mb-1">{cred.name}</div>
                  <div className="text-xs text-slate-500 mb-2">{cred.issuer}</div>
                  <div className="text-sm text-slate-600">{cred.description}</div>
                  {cred.validity && (
                    <div className="mt-2 text-xs text-brand-blue-600">Valid: {cred.validity}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-brand-blue-900 text-white rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Cosmetology Apprenticeship?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join our cohort and earn a competitive wage while building your skills toward your Indiana cosmetology license.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/programs/cosmetology-apprenticeship/apply"
              className="inline-block px-8 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/contact?program=cosmetology-apprenticeship"
              className="inline-block px-8 py-3 border border-white/30 text-white rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Request Information
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CosmetologyApprenticeshipClient() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const modules = [
    {
      id: 'prereq',
      title: 'Prerequisites',
      description: 'Review eligibility and application requirements',
      lessons: [
        { id: 'eligibility', title: 'Check Your Eligibility', slug: 'eligibility' },
        { id: 'host', title: 'Host Shop Information', slug: 'host-shops' },
      ],
    },
    {
      id: 'foundation',
      title: 'Foundation Skills',
      description: 'Core cosmetology fundamentals and salon operations',
      lessons: [
        { id: 'intro', title: 'Program Overview', href: '/programs/cosmetology-apprenticeship' },
        { id: 'host-shops', title: 'Approved Host Shops', href: '/programs/cosmetology-apprenticeship/host-shops' },
      ],
    },
    {
      id: 'practical',
      title: 'Practical Application',
      description: 'Hands-on skills and real salon experience',
      lessons: [
        { id: 'apply', title: 'Start Application', href: '/programs/cosmetology-apprenticeship/apply' },
        { id: 'bnpl', title: 'BNPL Payment Options', href: '/programs/cosmetology-apprenticeship/payment/bnpl' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-brand-blue-900 to-brand-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cosmetology Apprenticeship</h1>
          <p className="text-xl text-blue-100 mb-8">Earn while you learn. Build a thriving career in cosmetology.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/programs/cosmetology-apprenticeship/apply"
              className="inline-block px-8 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs/cosmetology-apprenticeship/eligibility"
              className="inline-block px-8 py-3 bg-white text-brand-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </div>

      {/* Program Overview */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">${TUITION_DOLLARS.toLocaleString()}</div>
            <div className="text-slate-600">Total Tuition</div>
            <div className="text-sm text-slate-500 mt-2">Flexible payment plans available</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">12 Weeks</div>
            <div className="text-slate-600">Program Duration</div>
            <div className="text-sm text-slate-500 mt-2">Full-time paid apprenticeship</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-brand-red-600 mb-2">Indiana</div>
            <div className="text-slate-600">Statewide Approved</div>
            <div className="text-sm text-slate-500 mt-2">DOL & WIOA Registered Program</div>
          </div>
        </div>

        {/* Program Curriculum */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Program Curriculum</h2>
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="border border-slate-200 rounded-lg">
                <button
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900">{module.title}</h3>
                    <p className="text-sm text-slate-500">{module.description}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedModule === module.id ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedModule === module.id && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <ul className="space-y-2">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link
                            href={lesson.href}
                            className="text-slate-600 hover:text-brand-blue-600 transition"
                          >
                            → {lesson.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-brand-blue-900 text-white rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Cosmetology Apprenticeship?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join our cohort and earn a competitive wage while building your skills.</p>
          <Link
            href="/programs/cosmetology-apprenticeship/apply"
            className="inline-block px-8 py-3 bg-brand-red-600 text-white rounded-lg font-semibold hover:bg-brand-red-700 transition"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}
