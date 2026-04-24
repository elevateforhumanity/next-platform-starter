

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, Users, Briefcase, Heart, RefreshCw, GraduationCap, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Become a Partner | Elevate for Humanity',
  description: 'Join the Elevate for Humanity partner network. Workforce agencies, employers, training providers, and community organizations.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/join' },
};

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Briefcase, GraduationCap, RefreshCw, Users, Heart,
};

const FALLBACK_PARTNER_TYPES = [
  { key: 'workforce-agency',  icon: 'Building2',    title: 'Workforce Agency',        description: 'Refer WIOA, Job Ready Indy, or WRG-funded participants to our approved training programs.',    apply_href: '/partners/apply' },
  { key: 'employer',          icon: 'Briefcase',    title: 'Employer',                description: 'Hire certified graduates, host apprentices, or post jobs to our placement pipeline.',            apply_href: '/partners/apply' },
  { key: 'training-provider', icon: 'GraduationCap',title: 'Training Provider',       description: 'Co-deliver programs, share facilities, or list your programs in our catalog.',                   apply_href: '/partners/apply' },
  { key: 'reentry-org',       icon: 'RefreshCw',    title: 'Reentry Organization',    description: 'Connect justice-involved individuals to Job Ready Indy-funded training and placement services.', apply_href: '/partners/apply' },
  { key: 'community-org',     icon: 'Users',        title: 'Community Organization',  description: 'Refer clients facing employment barriers to our programs and support services.',                  apply_href: '/partners/apply' },
  { key: 'philanthropic',     icon: 'Heart',        title: 'Philanthropic Supporter', description: 'Fund training, supplies, scholarships, or wraparound support services.',                          apply_href: '/philanthropy'   },
];

const STEPS = [
  { n: '1', title: 'Submit Application', desc: 'Complete the partner application — takes about 5 minutes.' },
  { n: '2', title: 'Discovery Call',     desc: 'We identify the right partnership model and programs for your organization.' },
  { n: '3', title: 'Sign Agreement',     desc: 'Execute an MOU or partnership agreement.' },
  { n: '4', title: 'Launch',             desc: 'Start referring participants, hiring graduates, or co-delivering programs.' },
];

export default async function JoinPartnerPage() {
  let partnerTypes = FALLBACK_PARTNER_TYPES;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('partner_types')
      .select('key, icon, title, description, apply_href, display_order')
      .eq('is_active', true)
      .order('display_order');
    if (data && data.length > 0) partnerTypes = data;
  } catch {
    // use fallback
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[220px] md:h-[300px] overflow-hidden">
        <Image
          src="/images/pages/about-partners-hero.jpg"
          alt="Elevate for Humanity partner network"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Barbershop partners — separate path */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Barbershop Apprenticeship Partners</p>
            <p className="text-sm text-amber-800 mt-1">
              Licensed barbershops joining the Indiana Barbershop Apprenticeship program use the dedicated portal below.
            </p>
          </div>
          <Link
            href="/program-holder/dashboard"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 transition"
          >
            Barbershop Portal <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Partnership types */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Partnership Types</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {partnerTypes.map((p) => {
            const Icon = ICON_MAP[p.icon] ?? Building2;
            return (
              <div key={p.key} className="border rounded-xl p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-black text-sm flex-1">{p.description}</p>
                <Link
                  href={p.apply_href}
                  className="mt-4 inline-flex items-center gap-1 text-brand-blue-600 text-sm font-medium hover:underline"
                >
                  Apply <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {s.n}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{s.title}</p>
                <p className="text-black text-sm mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-brand-blue-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Partner?</h2>
          <p className="text-white mb-6">Submit your application and we will follow up within 2 business days.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/partners/apply"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-blue-700 rounded-lg font-semibold hover:bg-brand-blue-50 transition"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/40 text-white rounded-lg font-medium hover:bg-white/10 transition"
            >
              View Programs
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
