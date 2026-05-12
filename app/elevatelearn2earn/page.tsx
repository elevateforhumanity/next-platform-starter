import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, DollarSign, GraduationCap, Briefcase, ArrowRight, BookOpen, Award } from 'lucide-react';
import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata: Metadata = siteMetadata({
  title: 'Elevate Learn 2 Earn — Get Paid While You Train',
  description:
    'Earn industry credentials and get paid while you train. Workforce funding through WIOA, SNAP-ET, and WRG covers tuition, supplies, and living stipends for eligible Indiana residents.',
  path: '/elevatelearn2earn',
});

const FUNDING_SOURCES = [
  {
    name: 'WIOA',
    full: 'Workforce Innovation and Opportunity Act',
    desc: 'Federal workforce funding for eligible adults and dislocated workers. Covers tuition, books, and support services.',
    href: '/programs/wioa-funding',
  },
  {
    name: 'SNAP-ET',
    full: 'SNAP Employment & Training',
    desc: 'For SNAP recipients — covers training costs and may include a monthly support stipend.',
    href: '/programs/snap-et',
  },
  {
    name: 'WRG',
    full: 'Workforce Ready Grant',
    desc: 'Indiana state grant covering tuition for high-demand credential programs at no cost to eligible residents.',
    href: '/programs/workforce-ready-grant',
  },
  {
    name: 'DOL Apprenticeship',
    full: 'Registered Apprenticeship',
    desc: 'Earn wages from day one as a DOL-registered apprentice. Employer pays you while Elevate provides the training.',
    href: '/programs/apprenticeships',
  },
];

const PROGRAMS = [
  { name: 'HVAC Technician', credential: 'EPA 608 Universal', duration: '6–8 weeks', href: '/programs/hvac-technician' },
  { name: 'Barber Apprenticeship', credential: 'Indiana Barber License', duration: '2 years', href: '/programs/barber-apprenticeship' },
  { name: 'Cosmetology Apprenticeship', credential: 'Indiana Cosmetology License', duration: '2 years', href: '/programs/cosmetology-apprenticeship' },
  { name: 'CNA Certification', credential: 'Indiana CNA License', duration: '6 weeks', href: '/programs/cna-certification' },
  { name: 'Medical Assistant', credential: 'NHA CCMA', duration: '16 weeks', href: '/programs/medical-assistant' },
  { name: 'Tax Preparation', credential: 'IRS AFSP', duration: '8 weeks', href: '/programs/tax-prep-financial-services' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Check eligibility', desc: 'Answer a few questions to see which funding sources you qualify for — takes under 2 minutes.' },
  { step: '2', title: 'Choose your program', desc: 'Pick from in-demand credentials in healthcare, trades, cosmetology, and business.' },
  { step: '3', title: 'Enroll with funding', desc: 'Our enrollment team handles the paperwork with your WorkOne case manager or FSSA worker.' },
  { step: '4', title: 'Train and earn', desc: 'Attend classes, complete your credential, and start your new career — often with a job offer before you graduate.' },
];

export default function ElevateLearn2EarnPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <DollarSign className="w-4 h-4" />
            Funding available for eligible Indiana residents
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
            Elevate Learn 2 Earn
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Get paid while you train. Workforce funding through WIOA, SNAP-ET, and Indiana's
            Workforce Ready Grant covers tuition, supplies, and living stipends — so you can focus
            on earning your credential, not paying for it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Check My Eligibility <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              View Programs <BookOpen className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-brand-red-600 text-white py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '$0', label: 'Out-of-pocket tuition for eligible students' },
            { value: '6–24', label: 'Weeks to a new career' },
            { value: '15+', label: 'Credential programs available' },
            { value: '3', label: 'Funding sources we work with' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-sm text-red-100 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white font-extrabold text-lg flex items-center justify-center mb-4">
                  {step.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding sources */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-4">Funding sources we work with</h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            Our enrollment team works directly with WorkOne, FSSA, and employer partners to connect
            you with the right funding before you start.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {FUNDING_SOURCES.map((f) => (
              <div key={f.name} className="border border-slate-200 rounded-2xl p-6 hover:border-brand-red-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-red-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-brand-red-600" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-lg">{f.name}</div>
                    <div className="text-xs text-slate-500 mb-2">{f.full}</div>
                    <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-4">Eligible programs</h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
            All programs below are approved for at least one workforce funding source.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROGRAMS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-brand-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors">
                      {p.name}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">{p.credential}</div>
                    <div className="text-xs text-slate-400 mt-1">{p.duration}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">What's included</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Industry-recognized credential', desc: 'Every program ends with a nationally or state-recognized certification.' },
              { icon: DollarSign, title: 'Funding coordination', desc: 'We handle the paperwork with your case manager so you don\'t have to.' },
              { icon: Briefcase, title: 'Job placement support', desc: 'Resume help, interview prep, and employer connections in your field.' },
              { icon: Award, title: 'Digital certificate', desc: 'Shareable, verifiable credential issued on completion.' },
              { icon: CheckCircle, title: 'WIOA-compliant reporting', desc: 'All required outcome tracking handled automatically.' },
              { icon: GraduationCap, title: 'Ongoing education', desc: 'Alumni access to continuing education and advanced credentials.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-red-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-brand-red-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">{item.title}</div>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to earn while you learn?</h2>
          <p className="text-slate-300 text-lg mb-10">
            Check your eligibility in under 2 minutes. No commitment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Check Eligibility <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Talk to an advisor
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
