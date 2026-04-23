import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  Building2, Users, FileText, TrendingUp,
  ArrowRight, ChevronRight, Settings, BarChart3,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partner Portal | Elevate for Humanity',
  description: 'Partner dashboard — manage referrals, track student progress, and access partnership resources.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partner-portal' },
  robots: { index: false, follow: false },
};

export default async function PartnerPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/partner-portal');

  const db = await getAdminClient();

  // Get partner profile
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, role, organization_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  // Check partner access
  const partnerRoles = ['partner', 'program_holder', 'org_admin', 'admin', 'super_admin'];
  if (profile && !partnerRoles.includes(profile.role)) {
    redirect('/lms/dashboard');
  }

  // Partner record
  const { data: partnerUser } = await db
    .from('partner_users')
    .select('id, partner_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const { count: referralCount } = await db
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id);

  const { count: activeStudents } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const NAV_ITEMS = [
    { label: 'Dashboard', href: '/partner/dashboard', icon: BarChart3, desc: 'Overview and key metrics' },
    { label: 'Students', href: '/partner/students', icon: Users, desc: 'Track referred student progress' },
    { label: 'Referrals', href: '/partner/referrals', icon: TrendingUp, desc: 'Manage your referral pipeline' },
    { label: 'Documents', href: '/partner/documents', icon: FileText, desc: 'MOUs, agreements, and reports' },
    { label: 'Settings', href: '/partner/settings', icon: Settings, desc: 'Account and organization settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner Portal' }]} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-1">Partner Portal</p>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </h1>
            {profile?.organization_name && (
              <p className="text-slate-500 text-sm mt-1">{profile.organization_name}</p>
            )}
          </div>
          <Link
            href="/partner/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-700 transition"
          >
            Full Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <TrendingUp className="w-6 h-6 text-brand-red-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{referralCount ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Total Referrals</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Users className="w-6 h-6 text-green-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{activeStudents ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Active Students</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <Building2 className="w-6 h-6 text-blue-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900 capitalize">{profile?.role ?? 'Partner'}</p>
            <p className="text-sm text-slate-500 mt-1">Account Type</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Icon className="w-6 h-6 text-brand-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto shrink-0 mt-0.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
