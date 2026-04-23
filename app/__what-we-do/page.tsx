export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/what-we-do' },
  title: 'What We Do | Elevate For Humanity',
  description:
    'Workforce training, credentialing, apprenticeships, and career support — how Elevate for Humanity serves learners, employers, and communities across Indiana.',
};

type ContentBlock = {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  order_index: number;
};

export default async function WhatWeDoPage() {
  const supabase = await createClient();

  const [{ data: blocks }, { count: programCount }] = await Promise.all([
    supabase
      .from('content_blocks')
      .select('id, title, body, icon, image_url, cta_label, cta_href, order_index')
      .eq('page', 'what_we_do')
      .eq('is_active', true)
      .order('order_index') as Promise<{ data: ContentBlock[] | null }>,
    supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'What We Do' }]} />
      </div>

      {/* Hero */}
      <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/training-provider-3.jpg"
          alt="Elevate for Humanity workforce training"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/55" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">What We Do</h1>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            We train, credential, and place workers in careers that pay — funded by WIOA, DOL, and employer partnerships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Get Started
            </Link>
            <Link href="/programs" className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              View Programs{programCount ? ` (${programCount}+)` : ''}
            </Link>
          </div>
        </div>
      </section>

      {/* DB-driven content blocks — renders when seeded */}
      {blocks && blocks.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blocks.map((block) => (
                <div key={block.id} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  {block.image_url && (
                    <div className="relative h-40 rounded-lg overflow-hidden mb-4">
                      <Image src={block.image_url} alt={block.title} fill className="object-cover" sizes="400px" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{block.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{block.body}</p>
                  {block.cta_label && block.cta_href && (
                    <Link href={block.cta_href} className="inline-flex items-center gap-1 text-brand-blue-600 text-sm font-medium hover:text-brand-blue-800">
                      {block.cta_label} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compliance strip */}
      <section className="py-10 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6">
            {[
              'ETPL-Approved',
              'WIOA Title I Compliant',
              'DOL Registered Apprenticeship Sponsor',
              'Perkins V Eligible',
              'RAPIDS Reporting',
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8">Join learners who have launched careers through our programs.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">
              Apply Now
            </Link>
            <Link href="/programs" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
