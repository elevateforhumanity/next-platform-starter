import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  Building2, Users, Briefcase, GraduationCap,
  CheckCircle, ArrowRight, Mail, Phone,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Partner With Us | Elevate for Humanity',
  description: 'Employer, education, and government partnership opportunities with Elevate for Humanity. Hire graduates, co-develop programs, or refer clients.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partner-with-us' },
};

const PARTNER_TYPES = [
  {
    icon: Briefcase,
    title: 'Employer Partners',
    desc: 'Hire trained graduates, host apprentices, or co-develop training aligned to your workforce needs.',
    benefits: [
      'Access to pre-screened, credentialed candidates',
      'Apprenticeship host employer program',
      'Custom training cohorts for your workforce',
      'RAPIDS-tracked apprenticeship compliance',
    ],
    cta: 'Become an Employer Partner',
    href: '/apply/employer',
  },
  {
    icon: Building2,
    title: 'Workforce Agency Partners',
    desc: 'Refer WIOA, FSSA, and WorkOne clients to ETPL-approved training programs.',
    benefits: [
      'ETPL-approved provider — WIOA eligible',
      'FSSA SNAP E&T participating provider',
      'Automated 80-hour participation tracking',
      'Outcome reporting for your agency',
    ],
    cta: 'Agency Partnership Request',
    href: '/fssa-partnership-request',
  },
  {
    icon: GraduationCap,
    title: 'Education Partners',
    desc: 'Articulation agreements, dual enrollment, and credit transfer partnerships.',
    benefits: [
      'Articulation agreements with community colleges',
      'Dual enrollment for high school students',
      'Credit transfer for completed credentials',
      'Shared curriculum development',
    ],
    cta: 'Contact Education Team',
    href: 'mailto:partnerships@elevateforhumanity.org',
  },
  {
    icon: Users,
    title: 'Community Partners',
    desc: 'Nonprofits, faith organizations, and community groups who refer and support participants.',
    benefits: [
      'Referral pipeline for your clients',
      'Co-location and outreach support',
      'Shared resource navigation',
      'Community impact reporting',
    ],
    cta: 'Start a Conversation',
    href: '/contact',
  },
];

export default async function PartnerWithUsPage() {
  const db = await getAdminClient();

  const { count: activePartners } = await db
    .from('partners')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: featuredPartners } = await db
    .from('partners')
    .select('id, name, city, state')
    .eq('status', 'active')
    .order('name')
    .limit(8);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partnerships', href: '/partnerships' }, { label: 'Partner With Us' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Partnership Opportunities</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Partner With Elevate for Humanity</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-6">
            Employers, workforce agencies, education institutions, and community organizations — we build partnerships that move people into careers.
          </p>
          <div className="flex items-center gap-3 text-slate-300 text-sm">
            <Building2 className="w-4 h-4 text-brand-red-400" />
            <span>{activePartners ?? '—'} active partner organizations</span>
          </div>
        </div>
      </section>

      {/* Partner types */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Partnership Types</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {PARTNER_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.title} className="rounded-xl border border-slate-200 p-7">
                  <Icon className="w-8 h-8 text-brand-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{type.title}</h3>
                  <p className="text-slate-600 mb-5">{type.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {type.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={type.href}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
                  >
                    {type.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active partners */}
      {featuredPartners && featuredPartners.length > 0 && (
        <section className="py-14 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Current Partners</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredPartners.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                  {p.city && <p className="text-xs text-slate-500 mt-1">{p.city}, {p.state}</p>}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/partnerships" className="text-sm font-semibold text-brand-red-600 hover:underline flex items-center gap-1">
                View all partnerships <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to Partner?</h2>
            <p className="text-slate-300 max-w-lg">
              Contact our partnerships team to discuss how we can work together to build Indiana's workforce.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <a
              href="mailto:partnerships@elevateforhumanity.org"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"
            >
              <Mail className="w-4 h-4" /> partnerships@elevateforhumanity.org
            </a>
            <a
              href="tel:+13173143757"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-300 hover:bg-white/5 transition"
            >
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
