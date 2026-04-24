// Revalidate every 5 minutes — host shop list changes infrequently.
// dynamic = 'force-dynamic' is intentionally NOT set: we want ISR, not SSR.
// On Netlify (no SUPABASE_SERVICE_ROLE_KEY at build time), getApprovedShops()
// returns [] and the page renders with empty state — no build failure.
export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Users, Award, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getApprovedShops, type HostShop } from '@/lib/programs/host-shops';

export const metadata: Metadata = {
  title: 'Approved Training Sites | Barber & Cosmetology Apprenticeship | Elevate for Humanity',
  description: 'View approved host shops for the Elevate for Humanity barber and cosmetology apprenticeship programs.',
};

function ShopCard({ shop }: { shop: HostShop }) {
  const isBarber = shop.programs.includes('barber-apprenticeship');
  const isCosmo = shop.programs.includes('cosmetology-apprenticeship');
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${shop.address}, ${shop.city}, ${shop.state} ${shop.zip}`)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {isBarber && <span className="text-xs font-bold text-brand-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Barber</span>}
            {isCosmo && <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Cosmetology</span>}
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-snug">{shop.name}</h3>
          {shop.supervisor && <p className="text-xs text-slate-500 mt-0.5">Supervisor: {shop.supervisor}</p>}
        </div>
        <Award className="w-5 h-5 text-brand-green-600 flex-shrink-0 ml-3 mt-1" />
      </div>
      <div className="space-y-1.5 mt-3">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm text-slate-600 hover:text-brand-blue-600 transition-colors">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{shop.address}, {shop.city}, {shop.state} {shop.zip}</span>
        </a>
        {shop.phone && (
          <a href={`tel:${shop.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-sm text-brand-blue-600 font-semibold hover:underline">
            <Phone className="w-4 h-4 flex-shrink-0" />{shop.phone}
          </a>
        )}
        {shop.email && (
          <a href={`mailto:${shop.email}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <Mail className="w-4 h-4 flex-shrink-0" />{shop.email}
          </a>
        )}
      </div>
    </div>
  );
}

export default async function HostShopsPage() {
  const shops = await getApprovedShops();
  const barberShops = shops.filter(s => s.programs.includes('barber-apprenticeship'));
  const cosmoShops = shops.filter(s => s.programs.includes('cosmetology-apprenticeship'));

  return (
    <main className="bg-white">
      <Breadcrumbs items={[
        { label: 'Programs', href: '/programs' },
        { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
        { label: 'Training Sites' },
      ]} />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[380px] max-h-[520px]">
        <Image src="/images/pages/barber-gallery-1.jpg" alt="Professional barbershop" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/60 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-10 w-full">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Approved Training Sites</h1>
            <p className="text-slate-300 text-lg max-w-2xl">All sites are verified, licensed, and DOL-registered. Apprentices are placed based on location and availability.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-8 justify-center text-center">
          <div><p className="text-3xl font-black text-white">{shops.length}</p><p className="text-slate-400 text-sm">Approved Sites</p></div>
          <div><p className="text-3xl font-black text-white">{barberShops.length}</p><p className="text-slate-400 text-sm">Barber Sites</p></div>
          <div><p className="text-3xl font-black text-white">{cosmoShops.length}</p><p className="text-slate-400 text-sm">Cosmetology Sites</p></div>
          <div><p className="text-3xl font-black text-white">Unlimited</p><p className="text-slate-400 text-sm">Apprentice Capacity</p></div>
        </div>
      </section>

      {/* Barber sites */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Barber Apprenticeship Sites</h2>
              <p className="text-slate-500 text-sm">{barberShops.length} approved location{barberShops.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {barberShops.length === 0
            ? <p className="text-slate-500 italic">No approved barber sites on file yet.</p>
            : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{barberShops.map(s => <ShopCard key={s.id} shop={s} />)}</div>
          }
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/programs/barber-apprenticeship/apply" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-xl font-bold transition">Apply for Barber Apprenticeship →</Link>
            <Link href="/partners/barbershop-apprenticeship/apply" className="inline-flex items-center gap-2 border-2 border-slate-900 text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-xl font-bold transition">Register Your Shop</Link>
          </div>
        </div>
      </section>

      {/* Cosmetology sites */}
      <section className="py-16 px-6 bg-slate-50 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Cosmetology Apprenticeship Sites</h2>
              <p className="text-slate-500 text-sm">{cosmoShops.length} approved location{cosmoShops.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {cosmoShops.length === 0
            ? <p className="text-slate-500 italic">No approved cosmetology sites on file yet.</p>
            : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{cosmoShops.map(s => <ShopCard key={s.id} shop={s} />)}</div>
          }
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/programs/cosmetology-apprenticeship/apply" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition">Apply for Cosmetology Apprenticeship →</Link>
            <Link href="/partners/cosmetology-apprenticeship/apply" className="inline-flex items-center gap-2 border-2 border-slate-900 text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-xl font-bold transition">Register Your Salon</Link>
          </div>
        </div>
      </section>

      {/* How placement works */}
      <section className="py-16 px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">How Shop Placement Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application and select a preferred shop or ask us to match you.' },
              { step: 2, title: 'Match', desc: 'We match you with an approved site based on location and availability.' },
              { step: 3, title: 'Orientation', desc: 'Complete your online orientation and paperwork before your first day.' },
              { step: 4, title: 'Start Training', desc: 'Begin logging OJT hours under a licensed supervisor.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-lg mx-auto mb-4">{item.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a host CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <Building2 className="w-12 h-12 mx-auto mb-6 text-slate-400" />
          <h2 className="text-3xl font-bold text-white mb-4">Own a Shop? Become a Training Site.</h2>
          <p className="text-slate-400 mb-8">We handle compliance, curriculum, and documentation — you provide the workspace and mentorship.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/partners/barbershop-apprenticeship/apply" className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition">Register as Barber Site</Link>
            <Link href="/partners/cosmetology-apprenticeship/apply" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold transition">Register as Cosmetology Site</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
