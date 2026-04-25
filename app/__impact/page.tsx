export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TrendingUp, Users, Award, Target, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const metadata: Metadata = {
  title: 'Impact & Outcomes | Elevate for Humanity',
  description:
    'Support sustainable workforce systems with measurable outcomes. See how Elevate for Humanity creates lasting impact for learners, employers, and communities.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/impact' },
};

type ImpactMetric = {
  id: string;
  label: string;
  value: string;
  category: string;
  description: string | null;
};

export default async function ImpactPage() {
  const supabase = await createClient();

  // Live counts from DB
  const [
    { count: enrolledCount },
    { count: completedCount },
    { count: certCount },
    { data: metrics },
  ] = await Promise.all([
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    supabase.from('impact_metrics').select('id, label, value, category, description').eq('is_active', true).order('display_order') as Promise<{ data: ImpactMetric[] | null }>,
  ]);

  const liveStats = [
    { label: 'Learners Enrolled', value: enrolledCount ? `${enrolledCount.toLocaleString()}+` : '—' },
    { label: 'Programs Completed', value: completedCount ? `${completedCount.toLocaleString()}+` : '—' },
    { label: 'Certificates Issued', value: certCount ? `${certCount.toLocaleString()}+` : '—' },
  ];

  return (
    <div className="bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Impact' }]} />
        </div>
      </div>

      {/* Hero */}
      <HeroVideo
        videoSrcDesktop={heroBanners['impact'].videoSrcDesktop}
        posterImage={heroBanners['impact'].posterImage}
        microLabel={heroBanners['impact'].microLabel}
        belowHeroHeadline={heroBanners['impact'].belowHeroHeadline}
        belowHeroSubheadline={heroBanners['impact'].belowHeroSubheadline}
        ctas={[heroBanners['impact'].primaryCta, ...(heroBanners['impact'].secondaryCta ? [heroBanners['impact'].secondaryCta] : [])]}
        trustIndicators={heroBanners['impact'].trustIndicators}
        transcript={heroBanners['impact'].transcript}
        analyticsName={heroBanners['impact'].analyticsName}
      />

      {/* Live stats from DB */}
      <section className="bg-brand-blue-700 text-white py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {liveStats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-blue-100 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DB-driven metrics — renders when seeded */}
      {metrics && metrics.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Outcomes by the Numbers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((m) => (
                <div key={m.id} className="bg-white rounded-xl p-6 border border-slate-100 text-center">
                  <div className="text-3xl font-bold text-brand-blue-600 mb-1">{m.value}</div>
                  <div className="font-semibold text-slate-900 mb-1">{m.label}</div>
                  {m.description && <p className="text-slate-500 text-xs">{m.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Funders Choose Elevate */}
      <section className="w-full py-20 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">Why Funders Choose Elevate</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Target, color: 'bg-brand-blue-600', title: 'Aligned with Funding Requirements', body: 'Programs designed to meet WIOA, WRG, DOL, and state workforce board requirements. Built-in compliance and reporting.' },
              { icon: TrendingUp, color: 'bg-brand-blue-600', title: 'Proven Outcomes', body: 'High completion rates, strong job placement, and wage gains. Real-time tracking and transparent reporting.' },
              { icon: Users, color: 'bg-brand-orange-600', title: 'Scalable Infrastructure', body: 'Technology platform that can be licensed and deployed across multiple sites, maximizing your investment.' },
              { icon: Award, color: 'bg-brand-green-600', title: 'Sustainable Model', body: 'Designed for long-term sustainability through employer partnerships, licensing, and diversified funding.' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-8">
                <div className={`w-16 h-16 ${item.color} rounded-xl flex items-center justify-center mb-6`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-4">{item.title}</h3>
                <p className="text-black">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Opportunities */}
      <section className="w-full py-20 bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">Partnership Opportunities</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              { title: 'Program Sponsorship', body: 'Fund specific training programs or cohorts. Direct impact with clear outcomes.' },
              { title: 'Platform Licensing', body: 'Support deployment of the platform to additional organizations and regions.' },
              { title: 'Barrier Removal Fund', body: 'Support wraparound services: transportation, childcare, emergency assistance.' },
              { title: 'Innovation & Expansion', body: 'Fund new program development, technology enhancements, or geographic expansion.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">{item.title}</h3>
                <p className="text-black">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 bg-white">
        <div className="mx-auto w-full max-w-4xl text-center px-6">
          <h2 className="text-4xl font-black text-black mb-6">Ready to Make an Impact?</h2>
          <p className="text-xl text-black mb-10">Let&apos;s discuss how your support can create lasting change in workforce development.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-10 py-5 rounded-xl font-bold text-lg transition shadow-lg">
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/about" className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-black px-10 py-5 rounded-xl font-bold text-lg transition">
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
