import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, GraduationCap, Briefcase, Users, ShieldCheck, FileText } from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Platform Features | Elevate for Humanity',
  description: 'Workforce training, credentialing, compliance tracking, and career placement — built for Indiana learners, agencies, and employers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/features' },
};

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'Credential-bearing programs',
    body: 'Every program ends with an industry-recognized credential — EPA 608, CompTIA, NHA, AWS, NCCER, Indiana state licensure, and more.',
  },
  {
    icon: FileText,
    title: 'Funding navigation',
    body: 'Training may be funded, grant-supported, employer-sponsored, or payment-based depending on the program and eligibility. We identify every source you qualify for.',
  },
  {
    icon: ShieldCheck,
    title: 'WIOA & ETPL compliance',
    body: 'Elevate is an approved ETPL provider. All programs meet WIOA Title I requirements for individual training accounts and performance reporting.',
  },
  {
    icon: Users,
    title: 'Workforce agency tools',
    body: 'Case managers can refer participants, track enrollment status, and pull WIOA outcome reports directly from the platform.',
  },
  {
    icon: Briefcase,
    title: 'Employer connections',
    body: 'Graduates are connected to hiring employers through our job placement network. Employers can post openings and access OJT wage reimbursement.',
  },
  {
    icon: CheckCircle,
    title: 'DOL registered apprenticeships',
    body: 'Barber, cosmetology, nail technician, and culinary apprenticeships are DOL-registered. Apprentices earn wages from day one.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Platform</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">What Elevate for Humanity does</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Workforce training, credentialing, compliance tracking, and career placement — built for Indiana learners, agencies, and employers.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">View Programs</Link>
            <Link href="/check-eligibility" className="border-2 border-white/40 text-white font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">Check Eligibility</Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-sm text-amber-900">
            <strong>About tuition and funding:</strong> Training costs vary by program. Many students qualify for WIOA, Workforce Ready Grant, FSSA IMPACT, or Job Ready Indy funding that covers tuition at no cost. Some programs are employer-sponsored or available on a self-pay or payment plan basis. <Link href="/check-eligibility" className="underline font-bold">Check your eligibility</Link> to see what you qualify for.
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-slate-200 rounded-xl p-6">
              <f.icon className="w-6 h-6 text-brand-red-600 mb-3" />
              <h2 className="font-bold text-slate-900 mb-2">{f.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">Ready to get started?</h2>
          <p className="text-slate-600 text-sm mb-6">Check your eligibility, browse programs, or talk to an advisor.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/check-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Check Eligibility</Link>
            <Link href="/programs" className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Browse Programs</Link>
            <Link href="/contact" className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Talk to an Advisor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
