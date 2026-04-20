export const dynamic = 'force-static';
export const revalidate = 3600;

import Link from 'next/link';
import { Shield, Clock, DollarSign, FileText } from 'lucide-react';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

const leftItems = [
  'W-2 employees',
  'Self-employed / Schedule C',
  'Rental income / Schedule E',
  'Capital gains (1099-B)',
  'Retirement distributions (1099-R)',
  'Social Security income',
];

const rightItems = [
  'Student loan interest deduction',
  'Educator expenses',
  'HSA deductions',
  'Earned Income Tax Credit (EITC)',
  'Child and Dependent Care Credit',
  'Education credits (AOC / LLC)',
];

const features = [
  {
    icon: Shield,
    title: 'PTIN Certified',
    body: 'Every return is prepared or reviewed by an IRS-registered tax preparer with a current PTIN.',
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    body: 'Most returns are completed the same day — walk-ins welcome, no appointment required.',
  },
  {
    icon: DollarSign,
    title: 'Refund Advance up to $7,500',
    body: 'Get a same-day advance on your expected refund with zero interest and zero fees.',
  },
  {
    icon: FileText,
    title: '1-Year Audit Support Included',
    body: 'Every filing comes with a full year of audit representation from a credentialed preparer.',
  },
];

const steps = [
  { number: 1, label: 'Book', body: 'Schedule online, call us, or walk in.' },
  { number: 2, label: 'Prepare', body: 'Your PTIN-certified preparer handles every form.' },
  { number: 3, label: 'File & Get Paid', body: 'We e-file and your refund is on its way.' },
];

export default function TaxPreparationPage() {
  return (
    <>
      <SupersonicPageHero
        image="/images/pages/supersonic-tax-prep.jpg"
        alt="PTIN-certified tax preparer working with a client at Supersonic Fast Cash"
        title="Professional Tax Preparation"
        subtitle="PTIN-credentialed preparers. E-file included. Refund advance available."
      />

      {/* What We Handle */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">What We Handle</h2>
          <p className="text-slate-600 text-center mb-10">
            From simple W-2s to multi-income returns — we file it all accurately.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ul className="space-y-3">
              {leftItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <ul className="space-y-3">
              {rightItems.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Why Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-red-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">How It Works</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-6 sm:gap-0">
            {steps.map((step, i) => (
              <div key={step.number} className="flex sm:flex-col items-center gap-4 sm:gap-2 flex-1">
                <div className="flex items-start gap-4 sm:flex-col sm:items-center">
                  <div className="w-12 h-12 rounded-full bg-brand-red-600 text-white font-black text-lg flex items-center justify-center flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="sm:text-center">
                    <p className="font-bold text-slate-900">{step.label}</p>
                    <p className="text-sm text-slate-600">{step.body}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block flex-1 h-px bg-slate-200 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-10 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-slate-700 text-lg">
            Returns start at <span className="font-bold text-slate-900">$149</span> for simple W-2 filers.{' '}
            <Link href="/supersonic-fast-cash/pricing" className="text-brand-red-600 hover:text-brand-red-700 font-semibold underline underline-offset-2">
              See full pricing →
            </Link>
          </p>
        </div>
      </section>

      {/* Bottom dual CTA */}
      <section className="py-14 bg-brand-blue-900">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Ready to File?</h2>
          <p className="text-blue-200 mb-8">Get your maximum refund with a PTIN-certified preparer.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              href="/supersonic-fast-cash/start"
              className="inline-block border-2 border-white text-white hover:bg-white hover:text-brand-blue-900 font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Start Online
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
