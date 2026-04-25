import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  Heart, Users, Award, CheckCircle, ArrowRight,
  Briefcase, Phone, Mail, Building2,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Serene Comfort Care | Healthcare Partner | Elevate for Humanity',
  description: 'Serene Comfort Care partners with Elevate for Humanity to provide healthcare career training and job placement for CNA and home health aide graduates.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/serene-comfort-care' },
};

const PROGRAMS = [
  { title: 'Certified Nursing Assistant (CNA)', slug: 'cna', credential: 'State CNA License' },
  { title: 'Healthcare Fundamentals', slug: 'healthcare', credential: 'Industry Certificate' },
  { title: 'Peer Recovery Specialist', slug: 'peer-recovery-specialist', credential: 'CPRS Certification' },
];

export default async function SereneComfortCarePage() {
  const db = await getAdminClient();

  // Pull partner record if it exists
  const { data: partner } = await db
    .from('partners')
    .select('id, name, city, state, description, website, status')
    .ilike('name', '%serene%comfort%')
    .maybeSingle();

  // Pull CNA enrollment stats as proof of pipeline
  const { data: cnaProgram } = await db
    .from('programs')
    .select('id, title')
    .eq('slug', 'cna')
    .maybeSingle();

  const { count: cnaEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', cnaProgram?.id ?? '')
    .eq('status', 'active');

  const { count: cnaCompletions } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', cnaProgram?.id ?? '')
    .eq('status', 'completed');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partners', href: '/partnerships' }, { label: 'Serene Comfort Care' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Healthcare Employer Partner</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Serene Comfort Care</h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-4">
            Serene Comfort Care partners with Elevate for Humanity to connect trained healthcare workers with meaningful employment in home health and personal care services.
          </p>
          {partner?.city && (
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {partner.city}, {partner.state}
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-red-600 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-10 text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">{cnaEnrollments ?? '—'}</p>
            <p className="text-red-100 text-sm mt-1">Active CNA Students</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{cnaCompletions ?? '—'}</p>
            <p className="text-red-100 text-sm mt-1">CNA Graduates</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">ETPL</p>
            <p className="text-red-100 text-sm mt-1">Approved Provider</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">WIOA</p>
            <p className="text-red-100 text-sm mt-1">Funding Accepted</p>
          </div>
        </div>
      </section>

      {/* About the partnership */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <Heart className="w-8 h-8 text-brand-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About the Partnership</h2>
            {partner?.description ? (
              <p className="text-slate-600 mb-4">{partner.description}</p>
            ) : (
              <p className="text-slate-600 mb-4">
                Serene Comfort Care is a healthcare employer committed to providing compassionate home health and personal care services in Indiana. Through their partnership with Elevate for Humanity, they hire CNA graduates and support workforce development in the healthcare sector.
              </p>
            )}
            <ul className="space-y-3">
              {[
                'Preferred employer for Elevate CNA graduates',
                'Participates in apprenticeship and on-the-job training',
                'Accepts WIOA-funded training referrals',
                'Provides mentorship for new healthcare workers',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Partner Programs</h3>
              <ul className="space-y-3">
                {PROGRAMS.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/programs/${p.slug}`} className="block hover:bg-slate-50 rounded-lg p-2 -mx-2 transition">
                      <p className="font-semibold text-slate-900 text-sm">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.credential}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {partner?.website && (
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-slate-200 p-4 text-center text-sm font-semibold text-brand-red-600 hover:bg-slate-50 transition"
              >
                Visit Serene Comfort Care <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Healthcare careers CTA */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Start a Healthcare Career</h2>
          <p className="text-slate-600 mb-8">
            Enroll in our CNA or healthcare programs and connect with employer partners like Serene Comfort Care upon graduation.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {PROGRAMS.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Award className="w-6 h-6 text-brand-red-500 mb-3" />
                <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.credential}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-red-600">
                  View program <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
          <div>
            <Briefcase className="w-8 h-8 text-brand-red-400 mb-3" />
            <h2 className="text-2xl font-bold mb-2">Become a Healthcare Partner</h2>
            <p className="text-slate-300 max-w-lg">
              Healthcare employers can partner with Elevate to hire trained graduates, host apprentices, or co-develop training programs.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/partner-with-us"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"
            >
              <Users className="w-4 h-4" /> Partner With Us
            </Link>
            <a
              href="mailto:partnerships@elevateforhumanity.org"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-300 hover:bg-white/5 transition"
            >
              <Mail className="w-4 h-4" /> Contact Partnerships
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
