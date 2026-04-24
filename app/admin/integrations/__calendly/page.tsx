import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Calendly | Integrations | Admin',
  robots: { index: false, follow: false },
};

export default async function CalendlyIntegrationPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await getAdminClient();

  // Live bookings from DB
  const { data: bookings } = await db
    .from('calendly_bookings')
    .select('id, invitee_name, invitee_email, event_name, start_time, status, utm_source, created_at')
    .order('start_time', { ascending: false })
    .limit(50);

  const [scheduled, canceled] = [
    (bookings ?? []).filter(b => b.status === 'scheduled').length,
    (bookings ?? []).filter(b => b.status === 'canceled').length,
  ];

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org'}/api/chatbot/calendly-webhook`;
  const hasSecret = !!process.env.CALENDLY_WEBHOOK_SECRET;
  const hasPublicUrl = !!process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Integrations', href: '/admin/integrations' },
          { label: 'Calendly' },
        ]} />

        <div className="mt-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calendly</h1>
            <p className="text-slate-500 text-sm">Scheduling and booking management</p>
          </div>
        </div>

        {/* Status cards */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Webhook</p>
            <div className="mt-1 flex items-center gap-1.5">
              {hasSecret
                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                : <XCircle className="w-4 h-4 text-red-400" />}
              <span className="text-sm font-medium text-slate-900">
                {hasSecret ? 'Secret configured' : 'Secret missing'}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Scheduled</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{scheduled}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Canceled</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{canceled}</p>
          </div>
        </div>

        {/* Setup instructions */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Webhook Configuration</h2>
          <p className="text-sm text-slate-600 mb-3">
            In your Calendly account under <strong>Integrations → Webhooks</strong>, add this URL:
          </p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
            <code className="text-sm text-slate-700 flex-1 break-all">{webhookUrl}</code>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Subscribe to: <code className="bg-slate-100 px-1 rounded">invitee.created</code> and <code className="bg-slate-100 px-1 rounded">invitee.canceled</code>
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Scheduling Links</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Main booking URL</span>
                {hasPublicUrl
                  ? <a href={process.env.NEXT_PUBLIC_CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View →</a>
                  : <span className="text-xs text-slate-400">Set NEXT_PUBLIC_CALENDLY_URL</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">30-min link</span>
                {process.env.NEXT_PUBLIC_CALENDLY_30MIN
                  ? <a href={process.env.NEXT_PUBLIC_CALENDLY_30MIN} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View →</a>
                  : <span className="text-xs text-slate-400">Set NEXT_PUBLIC_CALENDLY_30MIN</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings table */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Bookings</h2>
            <span className="text-sm text-slate-400">{bookings?.length ?? 0} total</span>
          </div>
          {!bookings?.length ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              No bookings yet. Bookings will appear here once the webhook receives events.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Name', 'Email', 'Event', 'Time', 'Source', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{b.invitee_name}</td>
                      <td className="px-4 py-3 text-slate-500">{b.invitee_email}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{b.event_name}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(b.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{b.utm_source ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
