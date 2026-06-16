import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Find a Barber Shop | Elevate for Humanity',
  description: 'Find participating barber shops in our apprenticeship network. Connect with local barbershops offering apprenticeship opportunities.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/find-barbershop' },
};

export default function FindBarbershopPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Partners', href: '/partners' },
            { label: 'Find a Barber Shop' }
          ]} />
        </div>
      </div>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Search className="w-4 h-4" />
            Partner Network
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Find a Barber Shop
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Connect with participating barbershops in our apprenticeship network.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-red-50 border border-brand-red-100 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Looking for Training Opportunities?</h2>
            <p className="text-slate-600 mb-6">
              Our barber apprenticeship program partners with barbershops across the region. 
              If you&apos;re interested in becoming an apprentice, apply through our program.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/barber-apply" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Apply for Apprenticeship
              </Link>
              <Link href="/partners/barber-host-shop" className="inline-flex items-center border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors">
                Learn About Host Shops
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Want to list your barbershop?</h3>
            <p className="text-slate-600 mb-4">
              If you&apos;re a barbershop owner interested in hosting apprentices, 
              join our partner network to connect with aspiring barbers.
            </p>
            <Link href="/partners/barber-host-shop/apply" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
              Apply to Become a Host Shop →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Have questions?</h3>
            <p className="text-slate-600 mb-4">
              Our team is here to help you find the right opportunity or partner with us.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
              Contact Us →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}