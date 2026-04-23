import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partner Portal | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/portal',
  },
  robots: { index: false, follow: false },
};

interface Partner {
  id: string;
  name: string;
  owner_name: string;
  email: string;
  city: string;
  state: string;
  status: string;
  apprentice_capacity: number;
  created_at: string;
}

interface PartnerApplication {
  id: string;
  shop_name: string;
  owner_name: string;
  email: string;
  city: string;
  state: string;
  status: string;
  programs_requested: string[];
  created_at: string;
}

export default async function PartnersPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/partners/portal');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? '';
  const isAdmin = ['admin', 'super_admin', 'staff'].includes(role);

  // Partner users see their own partner record; admins see all
  let partners: Partner[] = [];
  let applications: PartnerApplication[] = [];
  let partnerRecord: Partner | null = null;

  if (isAdmin) {
    const [partnersRes, appsRes] = await Promise.all([
      supabase
        .from('partners')
        .select('id, name, owner_name, email, city, state, status, apprentice_capacity, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('partner_applications')
        .select('id, shop_name, owner_name, email, city, state, status, programs_requested, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    partners = partnersRes.data ?? [];
    applications = appsRes.data ?? [];
  } else {
    // Find partner record linked to this user via partner_users
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (partnerUser?.partner_id) {
      const { data } = await supabase
        .from('partners')
        .select('id, name, owner_name, email, city, state, status, apprentice_capacity, created_at')
        .eq('id', partnerUser.partner_id)
        .single();
      partnerRecord = data ?? null;
    }

    if (!partnerRecord) {
      // No partner record — redirect to application
      redirect('/partners/apply');
    }
  }

  const activeCount = partners.filter((p) => p.status === 'active').length;
  const pendingApps = applications.filter((a) => a.status === 'pending' || a.status === 'submitted').length;
  const totalCapacity = partners.reduce((sum, p) => sum + (p.apprentice_capacity ?? 0), 0);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'Partner Network' : `${partnerRecord?.name ?? 'Partner'} Portal`}
            </h1>
            <p className="text-gray-500 mt-1">
              {isAdmin
                ? 'Manage partner organizations and review applications.'
                : 'Manage your partnership, apprentices, and program participation.'}
            </p>
          </div>
          {isAdmin && (
            <a
              href="/partners/apply"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Invite Partner
            </a>
          )}
        </div>

        {/* Admin stats */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Partners', value: partners.length },
              { label: 'Active', value: activeCount },
              { label: 'Pending Applications', value: pendingApps },
              { label: 'Total Apprentice Capacity', value: totalCapacity },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Single partner view */}
        {!isAdmin && partnerRecord && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Organization Details</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Owner</dt>
                  <dd className="font-medium text-gray-900">{partnerRecord.owner_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium text-gray-900">{partnerRecord.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Location</dt>
                  <dd className="font-medium text-gray-900">{partnerRecord.city}, {partnerRecord.state}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Apprentice Capacity</dt>
                  <dd className="font-medium text-gray-900">{partnerRecord.apprentice_capacity}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      partnerRecord.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {partnerRecord.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Partner Since</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(partnerRecord.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: 'View Apprentices', href: '/partner-portal/apprentices' },
                    { label: 'Log Hours', href: '/partner-portal/hours' },
                    { label: 'Attendance Records', href: '/partner-portal/attendance' },
                    { label: 'Contact Support', href: '/contact' },
                  ].map((action) => (
                    <a
                      key={action.href}
                      href={action.href}
                      className="block w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin: pending applications */}
        {isAdmin && applications.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Recent Applications</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Shop</th>
                    <th className="px-6 py-3 text-left">Owner</th>
                    <th className="px-6 py-3 text-left">Location</th>
                    <th className="px-6 py-3 text-left">Programs</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Submitted</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{app.shop_name}</td>
                      <td className="px-6 py-4 text-gray-600">{app.owner_name}</td>
                      <td className="px-6 py-4 text-gray-500">{app.city}, {app.state}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {(app.programs_requested ?? []).join(', ') || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : app.status === 'denied'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {app.status ?? 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/admin/partners/applications/${app.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin: partners table */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Partner Organizations</h2>
            </div>
            {partners.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No partners yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Owner</th>
                      <th className="px-6 py-3 text-left">Location</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Capacity</th>
                      <th className="px-6 py-3 text-left">Joined</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {partners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{partner.name}</td>
                        <td className="px-6 py-4 text-gray-600">{partner.owner_name}</td>
                        <td className="px-6 py-4 text-gray-500">{partner.city}, {partner.state}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            partner.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : partner.status === 'suspended'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {partner.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-700">
                          {partner.apprentice_capacity}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(partner.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`/admin/partners/${partner.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Manage
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
