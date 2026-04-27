export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Mail, UserPlus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Submitted | Barber Apprenticeship',
  robots: 'noindex',
};

export default function BarberApplySuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Application Submitted</h1>
          <p className="text-slate-600 text-base">
            Your application to the Barber Apprenticeship has been received. We&apos;ll be in touch within 1 business day.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-5">
          <div className="bg-brand-blue-600 px-6 py-4 flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-white flex-shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Create your account</p>
              <p className="text-brand-blue-200 text-xs">
                Required to access orientation and your apprentice dashboard
              </p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm mb-4">
              Use the same email address you used on your application. Your enrollment will be linked automatically.
            </p>
            <Link
              href="/signup?role=apprentice&redirect=/programs/barber-apprenticeship/orientation"
              className="block w-full text-center py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
            >
              Create Account &amp; Continue
            </Link>
            <p className="text-center text-xs text-slate-500 mt-3">
              Already have an account?{' '}
              <Link
                href="/login?redirect=/programs/barber-apprenticeship/orientation"
                className="text-brand-blue-600 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-5">
          <h2 className="font-bold text-slate-900 mb-4">What happens next</h2>
          <div className="space-y-3">
            {[
              'Create your account above using the same email from your application.',
              'Complete the orientation — takes about 10–12 minutes.',
              'Upload your government-issued ID.',
              'Our team reviews your application — usually within 1–2 business days.',
              'Once approved, we confirm your funding and match you with a licensed host barbershop.',
              'You begin your apprenticeship — earning $12–15/hour from day one.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand-blue-100 text-brand-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 mb-5 text-center">
          <p className="text-brand-blue-900 font-bold text-sm">DOL Registered Apprenticeship</p>
          <p className="text-brand-blue-700 text-xs mt-1">
            RAPIDS ID: 2025-IN-132301 · Indiana State Board Approved · Earn while you learn
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-slate-500 text-sm mb-4">Questions? We&apos;re here to help.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:3173143757"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
            <a href="mailto:info@elevateforhumanity.org"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium">
              <Mail className="w-4 h-4" /> Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
