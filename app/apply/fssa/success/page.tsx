import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Mail, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Received | FSSA IMPACT | Elevate for Humanity',
  robots: { index: false },
};

export default function FssaSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Application Received</h1>
        <p className="text-slate-600 mb-8">
          Thank you for applying to the FSSA IMPACT program. Our team will review your
          application and contact you within <strong>1–2 business days</strong>.
        </p>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-left space-y-4 mb-8">
          <p className="text-sm font-bold text-slate-700">What happens next:</p>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">We review your application and verify SNAP/TANF eligibility with FSSA.</p>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">An enrollment coordinator will call or email you to confirm your program and start date.</p>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">Check your email for a confirmation and next steps.</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Questions? Call us at{' '}
          <a href="tel:+13175594999" className="text-brand-blue-600 font-semibold underline">
            (317) 559-4999
          </a>{' '}
          or email{' '}
          <a href="mailto:enroll@elevateforhumanity.org" className="text-brand-blue-600 font-semibold underline">
            enroll@elevateforhumanity.org
          </a>
        </p>

        <Link href="/programs" className="inline-block bg-brand-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-blue-700 transition-colors text-sm">
          Browse Programs
        </Link>
      </div>
    </div>
  );
}
