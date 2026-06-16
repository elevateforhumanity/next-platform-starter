import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, CheckCircle, DollarSign, Clock, FileText, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Enroll Your Barbershop | Elevate for Humanity',
  description: 'Enroll your barbershop as a host location for our barber apprenticeship program. Join our network and help train the next generation of barbers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/enroll-barbershop' },
};

export default function EnrollBarbershopPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Partners', href: '/partners' },
            { label: 'Enroll as Host Shop' }
          ]} />
        </div>
      </div>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Users className="w-4 h-4" />
            Host Shop Enrollment
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Enroll Your Barbershop
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join our network of barbershops hosting barber apprentices.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white border border-slate-200 rounded-xl p-8">
              <div className="w-14 h-14 bg-brand-red-100 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7 text-brand-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Requirements</h2>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Licensed barbershop in good standing
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Experienced barbers to mentor apprentices
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Commitment to training schedule
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  Willingness to complete partnership agreement
                </li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7 text-brand-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Benefits</h2>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                  Access to funding and grants
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                  Training curriculum provided
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                  Ongoing support from our team
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                  Network of partner barbershops
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-brand-red-50 border border-brand-red-100 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Enroll?</h2>
            <p className="text-slate-600 mb-6">
              Complete our host shop application to start your partnership journey.
            </p>
            <Link href="/partners/barber-host-shop/apply" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Start Enrollment
            </Link>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Questions?</h3>
            <p className="text-slate-600 mb-4">
              Our partner coordination team is here to help you get started.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
              Contact Partner Support →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}