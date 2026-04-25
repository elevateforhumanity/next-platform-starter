import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/grants/revenue' },
  title: 'Grant Revenue | Elevate For Humanity',
  description: 'Track grant revenue and funding allocations.',
};

function formatCurrency(cents: number): string {
  if (cents >= 1_000_000) return `$${(cents / 1_000_000).toFixed(1)}M`;
  if (cents >= 1_000) return `$${(cents / 1_000).toFixed(0)}K`;
  return `$${cents.toFixed(0)}`;
}

export default async function GrantRevenuePage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('grant_applications')
    .select('status, amount_requested, amount_awarded');

  const totalAwarded = (applications ?? [])
    .filter((a) => a.status === 'approved' && a.amount_awarded != null)
    .reduce((sum, a) => sum + Number(a.amount_awarded ?? 0), 0);

  const totalPending = (applications ?? [])
    .filter((a) => ['submitted', 'under_review'].includes(a.status) && a.amount_requested != null)
    .reduce((sum, a) => sum + Number(a.amount_requested ?? 0), 0);

  const activeCount = (applications ?? []).filter((a) =>
    ['submitted', 'under_review'].includes(a.status)
  ).length;

  const approvedApplications = (applications ?? []).filter((a) => a.status === 'approved');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-slate-700"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/grants" className="hover:text-primary">Grants</Link></li><li>/</li><li className="text-slate-900 font-medium">Revenue</li></ol></nav>
          <h1 className="text-3xl font-bold text-slate-900">Grant Revenue</h1>
          <p className="text-slate-700 mt-2">Track funding and revenue from grants</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-slate-700">Total Awarded</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">$2.4M</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-slate-700">Received YTD</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">$1.8M</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-slate-700">Pending</h3><p className="text-3xl font-bold text-yellow-600 mt-2">$600K</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-slate-700">Active Grants</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">8</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Revenue Breakdown</h2><p className="text-slate-700">Detailed grant revenue tracking</p></div>
      </div>
    </div>
  );
}
