import type { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign, CheckCircle, ChevronRight, FileText, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Financial Aid & Funding | Help Center | Elevate for Humanity',
  description: 'Learn about WIOA funding, employer sponsorship, and other ways to cover the cost of your Elevate program.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/articles/financial-aid' },
};

const FUNDING_OPTIONS = [
  {
    title: 'WIOA (Workforce Innovation and Opportunity Act)',
    badge: 'Most Common',
    badgeColor: 'bg-green-100 text-green-700',
    desc: 'Federal funding administered through your local WorkOne center. Covers tuition, fees, and sometimes supplies for eligible learners. Eligibility is based on employment status, income, and other factors.',
    steps: [
      'Visit your local WorkOne center or WorkOne.in.gov',
      'Complete an eligibility assessment with a career advisor',
      'Receive an Individual Training Account (ITA) approval',
      'Enroll in your Elevate program — tuition is billed directly to WorkOne',
    ],
  },
  {
    title: 'Employer Sponsorship',
    badge: 'Fastest',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'Many employers pay for employee training as part of workforce development or apprenticeship agreements. Ask your HR department if tuition assistance is available.',
    steps: [
      'Request a tuition assistance form from your employer',
      'Enroll in your Elevate program',
      'Submit your enrollment confirmation to HR',
      'Employer pays Elevate directly or reimburses you after completion',
    ],
  },
  {
    title: 'Registered Apprenticeship (DOL)',
    badge: 'Earn While You Learn',
    badgeColor: 'bg-amber-100 text-amber-700',
    desc: 'Apprenticeship programs combine paid on-the-job training with Elevate coursework. You earn wages from day one while completing your credential.',
    steps: [
      'Apply to an Elevate apprenticeship program (barber, cosmetology, HVAC, etc.)',
      'Get matched with a sponsoring employer',
      'Complete OJT hours and Elevate coursework simultaneously',
      'Earn your DOL completion certificate and industry credential',
    ],
  },
];

const FAQS = [
  { q: 'Do I have to pay anything upfront?', a: 'For WIOA-funded learners, no. Tuition is billed directly to WorkOne. For self-pay learners, a payment plan is available — contact us to discuss options.' },
  { q: 'How do I know if I qualify for WIOA?', a: 'Eligibility depends on employment status, income level, and other factors. Visit WorkOne.in.gov or call 1-800-891-6499 to start an assessment. Elevate staff can also help you navigate the process.' },
  { q: 'Can I use Pell Grant funding?', a: 'Pell Grants are available for programs offered through our higher education partners. Contact us to find out if your program qualifies.' },
  { q: 'What if my employer only covers part of the cost?', a: 'You can combine employer sponsorship with WIOA funding or a payment plan to cover the remaining balance. Contact our enrollment team to set this up.' },
  { q: 'Is there a deadline to apply for funding?', a: 'WIOA funding is available year-round but subject to availability. We recommend starting the WorkOne process at least 2 weeks before your intended start date.' },
];

export default function FinancialAidHelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <Link href="/help" className="hover:text-slate-700">Help Center</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/help/articles" className="hover:text-slate-700">Articles</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">Financial Aid</span>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">Financial Aid & Funding</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mt-4 mb-3">Paying for your program</h1>
        <p className="text-slate-600 mb-10">Most Elevate learners pay $0 out of pocket. Here are the funding options available and how to access them.</p>

        <div className="space-y-8 mb-12">
          {FUNDING_OPTIONS.map(({ title, badge, badgeColor, desc, steps }) => (
            <div key={title} className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${badgeColor}`}>{badge}</span>
              </div>
              <p className="text-slate-600 text-sm mb-4">{desc}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">How it works</p>
              <ol className="space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

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

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-5 text-center">
            <FileText className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-900 mb-1">Start WIOA application</p>
            <p className="text-slate-600 text-sm mb-3">Visit WorkOne to begin your eligibility assessment.</p>
            <a href="https://www.workone.in.gov" target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm">WorkOne.in.gov</a>
          </div>
          <div className="border border-slate-200 rounded-xl p-5 text-center">
            <Phone className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-900 mb-1">Talk to an advisor</p>
            <p className="text-slate-600 text-sm mb-3">We can help you navigate funding options and get enrolled.</p>
            <Link href="/contact" className="inline-block bg-slate-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-700 transition-colors text-sm">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
