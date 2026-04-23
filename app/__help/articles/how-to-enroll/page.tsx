import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to Enroll | Help Center | Elevate for Humanity',
  description: 'Step-by-step guide to enrolling in an Elevate for Humanity career training program.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/articles/how-to-enroll' },
};

const STEPS = [
  {
    step: '1',
    title: 'Choose a program',
    desc: 'Browse available programs at elevateforhumanity.org/programs. Each program page lists the credential earned, estimated duration, and funding options.',
    link: { href: '/programs', label: 'Browse programs' },
  },
  {
    step: '2',
    title: 'Check funding eligibility',
    desc: 'Most learners qualify for WIOA funding through WorkOne, which covers tuition at no cost. If you have employer sponsorship or plan to self-pay, you can skip this step.',
    link: { href: '/help/articles/financial-aid', label: 'Learn about funding' },
  },
  {
    step: '3',
    title: 'Submit an enrollment application',
    desc: 'Click "Enroll Now" on the program page and complete the enrollment form. You will need a valid email address and basic contact information.',
  },
  {
    step: '4',
    title: 'Confirm your funding',
    desc: 'If using WIOA, your WorkOne advisor will send an approval letter. Upload it in your learner dashboard or email it to enrollment@elevateforhumanity.org.',
  },
  {
    step: '5',
    title: 'Activate your account',
    desc: 'You will receive an email with a link to set your password and access the LMS. Click the link within 48 hours — it expires after that.',
  },
  {
    step: '6',
    title: 'Start learning',
    desc: 'Log in to your learner dashboard and begin your first lesson. Your progress is saved automatically.',
    link: { href: '/learner/dashboard', label: 'Go to dashboard' },
  },
];

const REQUIREMENTS = [
  'Valid email address',
  'Government-issued ID (for apprenticeship programs)',
  'High school diploma or GED (for some programs — check the program page)',
  'WIOA approval letter (if using WorkOne funding)',
];

const FAQS = [
  { q: 'How long does enrollment take?', a: 'The application itself takes about 10 minutes. If you are using WIOA funding, allow 1–2 weeks for WorkOne to process your approval before your start date.' },
  { q: 'Can I enroll in more than one program at a time?', a: 'Yes, but WIOA funding typically covers one program at a time. Contact your WorkOne advisor if you want to pursue multiple credentials.' },
  { q: 'What if I do not receive my activation email?', a: 'Check your spam folder first. If it is not there, contact support at support@elevateforhumanity.org and we will resend it.' },
  { q: 'Can I start immediately after enrolling?', a: 'For self-pay and employer-sponsored learners, yes — access is granted within 24 hours of enrollment confirmation. WIOA learners must wait for funding approval.' },
  { q: 'Is there an enrollment deadline?', a: 'Most programs are open enrollment with rolling start dates. Cohort-based programs have fixed start dates listed on the program page.' },
];

export default function HowToEnrollHelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <Link href="/help" className="hover:text-slate-700">Help Center</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/help/articles" className="hover:text-slate-700">Articles</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">How to Enroll</span>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">Enrollment</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mt-4 mb-3">How to enroll in a program</h1>
        <p className="text-slate-600 mb-10">Enrollment takes about 10 minutes. Here is everything you need to know before you start.</p>

        {/* What you need */}
        <section className="mb-10 bg-blue-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900">What you will need</h2>
          </div>
          <ul className="space-y-2">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Enrollment steps</h2>
          <div className="space-y-4">
            {STEPS.map(({ step, title, desc, link }) => (
              <div key={step} className="flex items-start gap-4 p-5 border border-slate-200 rounded-xl">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{step}</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-600 text-sm mt-1">{desc}</p>
                  {link && (
                    <Link href={link.href} className="inline-block mt-2 text-sm text-blue-600 hover:underline font-medium">
                      {link.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold text-slate-900 mb-1">{q}</p>
                <p className="text-slate-600 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">Ready to enroll?</p>
            <p className="text-slate-600 text-sm">Browse programs and start your application today.</p>
          </div>
          <Link href="/programs" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
            Browse Programs →
          </Link>
        </div>
      </div>
    </div>
  );
}
