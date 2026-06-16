import type { Metadata } from 'next';
import Link from 'next/link';
import { Store, Scissors, Users, DollarSign, MapPin, Phone, Clock, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Barber Partner Program | Elevate for Humanity',
  description: 'Join our network of barbershops hosting barber apprentices. Get funding support and help train the next generation of barbers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/barbershop' },
};

export default function BarbershopPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Partners', href: '/partners' },
            { label: 'Barber Host Shop' }
          ]} />
        </div>
      </div>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Store className="w-4 h-4" />
            Partner Program
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Barber Host Shop Program
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Partner with us to train the next generation of professional barbers.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Train Apprentices</h3>
              <p className="text-sm text-slate-600">Help develop skilled barbers for your community</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Funding Support</h3>
              <p className="text-sm text-slate-600">Access grants and funding for training programs</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">DOL-Registered</h3>
              <p className="text-sm text-slate-600">Official apprenticeship program certification</p>
            </div>
          </div>

          <div className="bg-brand-red-50 border border-brand-red-100 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Become a Host Shop</h2>
            <p className="text-slate-600 mb-6">
              Partner with Elevate for Humanity to host barber apprentices in your shop. 
              We provide the training curriculum, funding support, and ongoing guidance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/partners/barber-host-shop/apply" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Apply to Host
              </Link>
              <Link href="/contact" className="inline-flex items-center border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Ready to get started?</h3>
            <p className="text-slate-600 mb-4">
              Join our network of barbershops committed to training the next generation of barbers.
            </p>
            <Link href="/partners" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
              View All Partner Programs →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}