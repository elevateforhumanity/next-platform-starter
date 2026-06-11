import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Enrollment Complete',
  robots: { index: false, follow: false },
};

export default function PartnerCourseSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">Payment Received</h1>
          <p className="text-slate-600 mb-8">
            Your enrollment has been confirmed. Check your email for access instructions
            and next steps from the course provider.
          </p>

          <div className="bg-slate-50 rounded-xl p-6 text-left mb-8">
            <h2 className="font-semibold text-slate-900 mb-4">What Happens Next</h2>
            <div className="space-y-3">
              {[
                'You\'ll receive a confirmation email with your enrollment details',
                'The course provider will send access credentials within 1 business day',
                'Log in to the partner platform to begin your coursework',
                'Track your progress from your learner dashboard',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand-blue-600 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/login?redirect=/learner/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors mb-3"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-sm text-slate-500 mt-4">
            Questions? Call{' '}
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone}`} className="text-brand-blue-600 hover:underline font-medium">
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
