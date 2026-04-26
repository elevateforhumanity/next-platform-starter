import { Metadata } from 'next';
import Link from 'next/link';
import {
  ExternalLink,
  Phone,
  FileText,
  ArrowRight,
  DollarSign,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import { TransferHoursCalculator } from '../TransferHoursCalculator';

export const metadata: Metadata = {
  title: 'Payment & Funding Information | Barber Apprenticeship | Elevate for Humanity',
  description:
    'The Barber Apprenticeship is a self-pay program. Learn about our flexible payment plan options and how to get started.',
};

export default function BarberEligibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroVideo
        videoSrcDesktop="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero.mp4"
        videoSrcMobile="/videos/barber-hero-final.mp4"
        posterImage="/hero-images/barber-hero.jpg"
        microLabel="Barber Apprenticeship"
        analyticsName="barber-eligibility"
      >
        <div className="max-w-4xl">
          <Link
            href="/programs/barber-apprenticeship"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-5 transition text-sm"
          >
            ← Back to Program Details
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Payment &amp; Funding Information
          </h1>
          <p className="text-slate-700 text-lg leading-relaxed">
            The Barber Apprenticeship is a <strong>self-pay program</strong>. Use the calculator
            below to estimate weekly payments based on your transfer hours and down payment.
          </p>
        </div>
      </HeroVideo>

      {/* Self-Pay Notice */}
      <section className="py-10 bg-amber-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-4 bg-white border border-amber-300 rounded-xl p-6 shadow-sm">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-amber-900 mb-2">
                This Program Is Not Currently WIOA or Workforce Ready Grant Eligible
              </h2>
              <p className="text-amber-800 text-sm mb-3">
                The Barber Apprenticeship is not listed on Indiana&rsquo;s Eligible Training Provider List (ETPL)
                and does not qualify for WIOA or Workforce Ready Grant (WRG) funding at this time.
                Tuition must be paid directly by the student using our self-pay enrollment options.
              </p>
              <p className="text-amber-800 text-sm">
                If you have questions about funding, please contact your local WorkOne office or
                visit{' '}
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Indiana Career Connect
                </a>{' '}
                to explore other training options that may be covered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Self-Pay Options */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Self-Pay Options</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Weekly Payment Plan</h3>
              <p className="text-slate-600 text-sm mb-3">
                Pay a minimum $600 deposit to start, then make weekly payments every Friday for
                29 weeks. No interest — flat weekly rate based on your chosen deposit amount.
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• $600 minimum deposit due at enrollment</li>
                <li>• 29 fixed weekly payments</li>
                <li>• Total program cost: $4,980</li>
                <li>• Billed every Friday</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pay in Full</h3>
              <p className="text-slate-600 text-sm mb-3">
                Pay the full $4,980 upfront using our secure checkout. We accept credit/debit
                cards and BNPL options including Klarna, Afterpay, Affirm, and more.
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• One-time payment of $4,980</li>
                <li>• Instant enrollment confirmation</li>
                <li>• BNPL options available</li>
                <li>• No weekly billing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment Calculator</h2>
          <TransferHoursCalculator />
        </div>
      </section>

      {/* Indiana Career Connect Reference */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Indiana Career Connect</h2>
          <p className="text-slate-600 mb-6">
            While WIOA and WRG do not cover this program, Indiana Career Connect is still a
            valuable free resource for career exploration, résumé building, and job search.
            WorkOne case managers can also connect you with other funded training programs if
            you are exploring additional options.
          </p>

          <a
            href="https://www.indianacareerconnect.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Visit Indiana Career Connect
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="mt-8 bg-slate-50 rounded-lg p-4">
            <p className="font-medium text-slate-900 mb-2">Marion County WorkOne (Indianapolis):</p>
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Phone className="w-4 h-4" />
              <a href="tel:3176842400" className="hover:text-blue-600">
                (317) 684-2400
              </a>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>3500 DePauw Blvd, Indianapolis, IN 46268</span>
            </div>
          </div>
        </div>
      </section>

      {/* Apply Now CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <ArrowRight className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Ready to Enroll?</h3>
                <p className="text-blue-800 mb-4">
                  Start your barber apprenticeship today with a $600 deposit and flexible weekly
                  payments. Enrollment is open — no waiting on funding approvals.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/programs/barber-apprenticeship/apply"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Apply Now — Self-Pay
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/programs/barber-apprenticeship#pricing"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 border border-blue-300 px-5 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions About Payment?</h2>
          <p className="text-slate-300 mb-6">Our team can walk you through all payment options.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:+13173143757"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition"
            >
              <Phone className="w-5 h-5" />
              (317) 314-3757
            </a>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="inline-flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
