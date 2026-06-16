import type { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, Users, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Apply for Barber Apprenticeship | Elevate for Humanity',
  description: 'Apply to our DOL-registered barber apprenticeship program. Earn while you learn with hands-on training at partner barbershops.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/barber-apply' },
};

export default function BarberApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Programs', href: '/programs' },
            { label: 'Barber Apprenticeship', href: '/barber' },
            { label: 'Apply' }
          ]} />
        </div>
      </div>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Scissors className="w-4 h-4" />
            DOL-Registered Apprenticeship
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Apply for Barber Apprenticeship
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Start your career in barbering with paid, hands-on training.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-brand-red-50 border border-brand-red-100 rounded-2xl p-8">
              <div className="w-14 h-14 bg-brand-red-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">For Apprentices</h2>
              <p className="text-slate-600 mb-6">
                Start your career in barbering with paid, hands-on training. No experience required.
              </p>
              <ul className="space-y-3 mb-6 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand-red-500" /> Earn while you learn</li>
                <li className="flex items-center gap-2"><Scissors className="w-4 h-4 text-brand-red-500" /> Hands-on barbershop training</li>
                <li className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-red-500" /> Industry-recognized certification</li>
              </ul>
              <Link href="/apply/student?program=barber" className="inline-flex items-center justify-center w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Apply as Apprentice
              </Link>
            </div>

            <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-2xl p-8">
              <div className="w-14 h-14 bg-brand-blue-500 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">For Barbershops</h2>
              <p className="text-slate-600 mb-6">
                Host apprentices and grow your team. We provide training support and funding assistance.
              </p>
              <ul className="space-y-3 mb-6 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Users className="w-4 h-4 text-brand-blue-500" /> Train future barbers</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand-blue-500" /> Flexible scheduling</li>
                <li className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-blue-500" /> Funding support available</li>
              </ul>
              <Link href="/partners/barber-host-shop/apply" className="inline-flex items-center justify-center w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Host an Apprentice
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Have questions?</h3>
            <p className="text-slate-600 mb-4">Our team is here to help you get started.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
              Contact Us →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}