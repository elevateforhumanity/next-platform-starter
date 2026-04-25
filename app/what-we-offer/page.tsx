export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/what-we-offer' },
  title: 'What We Offer | Elevate For Humanity',
  description:
    'Training programs, industry credentials, apprenticeships, career placement, and employer partnerships — the full suite of services from Elevate for Humanity.',
};

type Offering = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  icon: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  features: string[];
  order_index: number;
};

export default async function WhatWeOfferPage() {
  const supabase = await createClient();

  const { data: offerings } = await supabase
    .from('offerings')
    .select('id, title, description, category, icon, image_url, cta_label, cta_href, features, order_index')
    .eq('status', 'active')
    .order('order_index') as { data: Offering[] | null };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'What We Offer' }]} />
      </div>

      {/* Hero */}
      <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/pages/comp-highlights-welding.jpg"
          alt="Elevate for Humanity offerings"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/55" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">What We Offer</h1>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Training, credentials, apprenticeships, and career support — everything you need to launch or advance your career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/programs" className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Browse Programs
            </Link>
            <Link href="/contact" className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      {/* DB-driven offerings */}
      {offerings && offerings.length > 0 ? (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offerings.map((offering) => (
                <div key={offering.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  {offering.image_url && (
                    <div className="relative h-44">
                      <Image src={offering.image_url} alt={offering.title} fill className="object-cover" sizes="400px" />
                    </div>
                  )}
                  <div className="p-6">
                    {offering.category && (
                      <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded-full uppercase tracking-wide">
                        {offering.category}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-slate-900 mt-3 mb-2">{offering.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{offering.description}</p>
                    {offering.features && offering.features.length > 0 && (
                      <ul className="space-y-1 mb-4">
                        {offering.features.map((f, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    {offering.cta_label && offering.cta_href && (
                      <Link href={offering.cta_href} className="inline-flex items-center gap-1 text-brand-blue-600 text-sm font-medium hover:text-brand-blue-800">
                        {offering.cta_label} <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 text-center text-slate-500">
            <p>Offerings are being updated. Check back soon or <Link href="/programs" className="text-brand-blue-600 underline">browse our programs</Link>.</p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8">Join learners who have launched careers through our programs.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">Apply Now</Link>
            <Link href="/programs" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">Browse Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
