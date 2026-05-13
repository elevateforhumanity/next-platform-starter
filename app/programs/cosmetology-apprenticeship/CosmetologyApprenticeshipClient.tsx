'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { TUITION_DOLLARS } from '@/lib/cosmetology/pricing';

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
