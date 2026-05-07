import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Users, Calendar, ClipboardList, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tax Services Portal | Elevate For Humanity',
  description: 'VITA tax preparation staff portal.',
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  {
    title: 'Tax Filings',
    desc: 'Review and manage client tax return submissions.',
    href: '/tax/filings',
    icon: FileText,
  },
  {
    title: 'Clients',
    desc: 'View client profiles and filing history.',
    href: '/tax/clients',
    icon: Users,
  },
  {
    title: 'Appointments',
    desc: 'Manage VITA appointment schedule.',
    href: '/tax/appointments',
    icon: Calendar,
  },
  {
    title: 'Applications',
    desc: 'Review incoming tax preparation applications.',
    href: '/tax/applications',
    icon: ClipboardList,
  },
  {
    title: 'Rise Up Foundation — Free Tax Help',
    desc: 'Public VITA free tax help program information.',
    href: '/tax/rise-up-foundation/free-tax-help',
    icon: ArrowRight,
  },
];

export default async function TaxPortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/tax');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (
    !profile ||
    !['vita_staff', 'admin', 'super_admin', 'staff'].includes(profile.role)
  ) {
    redirect('/unauthorized');
  }

  // Summary counts
  const [{ count: pendingFilings }, { count: todayAppts }] = await Promise.all([
    supabase
      .from('tax_filings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('vita_appointments')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_at', new Date().toISOString().split('T')[0])
      .lt(
        'scheduled_at',
        new Date(Date.now() + 86400000).toISOString().split('T')[0],
      ),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">
            VITA Tax Services
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Tax Services Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, {profile.full_name ?? user.email}
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{pendingFilings ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Pending Filings</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{todayAppts ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Appointments Today</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-0.5">{item.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
