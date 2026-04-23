'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ClipboardList, BookOpen, FileText, PenLine, CheckCircle2, CheckCircle, Lock, Scissors, Users, Award, DollarSign } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu/30min';

interface Props {
  isApproved?: boolean;
}

const REQUIREMENTS = [
  'Active Indiana Esthetician or Cosmetology establishment license',
  'Licensed supervising esthetician on staff (2+ years licensed)',
  'Ability to place apprentice on payroll from day one',
  'General liability insurance',
  'Willingness to complete MOU and quarterly progress reports',
];

const BENEFITS = [
  { icon: <DollarSign className="w-5 h-5 text-green-600" />, title: 'Wage Reimbursement', desc: 'Eligible for OJT wage reimbursement through WorkOne for WIOA-funded apprentices.' },
  { icon: <Users className="w-5 h-5 text-brand-blue-600" />, title: 'Pre-Screened Talent', desc: 'We recruit, screen, and match apprentices to your spa. You interview and select.' },
  { icon: <Award className="w-5 h-5 text-purple-600" />, title: 'Structured Curriculum', desc: '600-hour program with defined competency milestones. We handle all RTI coursework.' },
  { icon: <Scissors className="w-5 h-5 text-pink-600" />, title: 'License Pathway', desc: 'Apprentices graduate eligible to sit for the Indiana Esthetician state board exam.' },
];

const STEPS = [
  { n: '1', title: 'Apply Online', desc: 'Complete the host spa application. Takes about 10 minutes.' },
  { n: '2', title: 'Review & Approval', desc: 'Our team reviews your application within 3–5 business days and contacts you to schedule an onboarding call.' },
  { n: '3', title: 'Sign MOU', desc: 'Execute the Memorandum of Understanding outlining your responsibilities as a host site.' },
  { n: '4', title: 'Receive Apprentice Match', desc: 'We match a pre-screened apprentice to your spa. You conduct a final interview.' },
  { n: '5', title: 'Training Begins', desc: 'Apprentice joins your team on payroll. We provide RTI coursework and progress tracking.' },
];

const ONBOARDING_STEPS = [
  { icon: <ClipboardList className="w-5 h-5" />, label: 'Application', href: '/partners/esthetician-apprenticeship/apply', locked: false },
  { icon: <PenLine className="w-5 h-5" />, label: 'Sign MOU', href: '#', locked: true },
  { icon: <FileText className="w-5 h-5" />, label: 'Upload Documents', href: '#', locked: true },
  { icon: <BookOpen className="w-5 h-5" />, label: 'Partner Handbook', href: '#', locked: true },
];

export default function EstheticianPartnerPageClient({ isApproved = false }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Esthetician Apprenticeship' }]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 'clamp(380px, 45vw, 520px)' }}>
        <Image
          src="/images/pages/cosmetology-hero.jpg"
          alt="Esthetician apprenticeship host spa program"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-transparent" />
        <div className="relative z-10 h-full flex items-center" style={{ minHeight: 'clamp(380px, 45vw, 520px)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
            <p className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-3">Host Spa Partner Program</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 max-w-xl leading-tight">
              Grow Your Spa Team Through Indiana&apos;s Esthetician Apprenticeship
            </h1>
            <p className="text-white/80 text-lg max-w-lg mb-8">
              Host apprentices in your spa. Develop talent. Build your team through a USDOL Registered Apprenticeship — with wage reimbursement available.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/partners/esthetician-apprenticeship/apply"
                className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Apply as a Host Spa <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Schedule a Call
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 text-center">Why Partner With Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">{b.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{b.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8 text-center">How It Works</h2>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-4 bg-slate-50 rounded-2xl border border-slate-100 p-5">
                <div className="w-9 h-9 rounded-full bg-pink-600 text-white font-extrabold flex items-center justify-center flex-shrink-0">{s.n}</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5">{s.title}</h3>
                  <p className="text-sm text-slate-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6 text-center">Host Site Requirements</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            {REQUIREMENTS.map((r) => (
              <div key={r} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding portal (locked until approved) */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Partner Onboarding Portal</h2>
          <p className="text-slate-600 text-sm mb-6">Complete these steps after your application is approved.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {ONBOARDING_STEPS.map((step) => {
              const locked = step.locked && !isApproved;
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-4 rounded-2xl border p-5 ${locked ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200 bg-white hover:shadow-sm transition-shadow'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${locked ? 'bg-slate-100 text-slate-400' : 'bg-pink-50 text-pink-600'}`}>
                    {locked ? <Lock className="w-4 h-4" /> : step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{step.label}</p>
                    {locked && <p className="text-xs text-slate-400">Available after approval</p>}
                  </div>
                  {!locked && (
                    <Link href={step.href} className="text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1">
                      Open <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {!locked && step.label === 'Application' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-pink-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to Host an Apprentice?</h2>
          <p className="text-white/80 mb-8">Apply today. Our team will review your application and reach out within 3–5 business days.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/partners/esthetician-apprenticeship/apply"
              className="inline-flex items-center gap-2 bg-white text-pink-700 font-bold px-8 py-4 rounded-xl hover:bg-pink-50 transition-colors"
            >
              Apply as a Host Spa <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
