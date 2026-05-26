import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import {
  ClipboardList, DollarSign, Calendar, CheckCircle2,
  XCircle, Clock, AlertTriangle, User, RefreshCw, ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Testing Center Operations | Admin' };

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtMoney(cents: number | null) {
  if (!cents) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${Math.floor(diff / 60000)}m ago`;
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  no_show:   'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-600',
  rescheduled: 'bg-purple-100 text-purple-800',
};
const PAYMENT_STYLES: Record<string, string> = {
  paid:    'bg-green-100 text-green-800',
  unpaid:  'bg-red-100 text-red-800',
  refunded:'bg-slate-100 text-slate-600',
  waived:  'bg-blue-100 text-blue-800',
};

export default async function TestingCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; exam?: string; payment?: string; page?: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();
  const sp = await searchParams;

  const statusFilter  = sp.status  || '';
  const examFilter    = sp.exam    || '';
  const paymentFilter = sp.payment || '';
  const page = Math.max(1, parseInt(sp.page || '1', 10));
  const PAGE_SIZE = 50;

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const [
    { count: totalBookings },
    { count: pendingBookings },
    { count: confirmedBookings },
    { count: noShows },
    { count: paidCount },
    { data: recentRows },
  ] = await Promise.all([
    db.from('exam_bookings').select('*', { count: 'exact', head: true }),
    db.from('exam_bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('exam_bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    db.from('exam_bookings').select('*', { count: 'exact', head: true }).eq('status', 'no_show'),
    db.from('exam_bookings').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
    db.from('exam_bookings')
      .select('fee_cents')
      .eq('payment_status', 'paid')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  const revenueThisMonth = (recentRows ?? []).reduce((s: number, r: any) => s + (r.fee_cents ?? 0), 0);

  // ── Filtered bookings ────────────────────────────────────────────────────
  let query = db
    .from('exam_bookings')
    .select('id, exam_type, exam_name, booking_type, first_name, last_name, email, phone, participant_count, preferred_date, preferred_time, confirmed_date, confirmed_time, status, payment_status, fee_cents, confirmation_code, add_on, add_on_paid, admin_notes, created_at, updated_at, slot_id')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (statusFilter)  query = query.eq('status', statusFilter);
  if (examFilter)    query = query.eq('exam_type', examFilter);
  if (paymentFilter) query = query.eq('payment_status', paymentFilter);

  const { data: bookings, count: filteredCount } = await query;
  const rows = bookings ?? [];
  const totalPages = Math.ceil((filteredCount ?? 0) / PAGE_SIZE);

  // ── Distinct exam types for filter ──────────────────────────────────────
  const { data: examTypes } = await db
    .from('exam_bookings')
    .select('exam_type')
    .order('exam_type');
  const uniqueExams = [...new Set((examTypes ?? []).map((r: any) => r.exam_type).filter(Boolean))];

  // ── Upcoming confirmed (next 7 days) ─────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const { data: upcoming } = await db
    .from('exam_bookings')
    .select('id, first_name, last_name, exam_name, confirmed_date, confirmed_time, participant_count, add_on')
    .eq('status', 'confirmed')
    .gte('confirmed_date', today)
    .lte('confirmed_date', in7)
    .order('confirmed_date');

  function buildHref(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      ...(statusFilter  ? { status:  statusFilter  } : {}),
      ...(examFilter    ? { exam:    examFilter    } : {}),
      ...(paymentFilter ? { payment: paymentFilter } : {}),
      ...overrides,
    });
    return `/admin/testing-center?${p.toString()}`;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testing Center Operations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Exam bookings · payments · scheduling · outcomes
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/testing/book"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Booking Page
          </Link>
          <Link
            href="/admin/exam-authorizations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Authorizations
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Bookings',  value: totalBookings ?? 0,    icon: ClipboardList, color: 'text-slate-900' },
          { label: 'Pending',         value: pendingBookings ?? 0,  icon: Clock,         color: 'text-yellow-600' },
          { label: 'Confirmed',       value: confirmedBookings ?? 0,icon: Calendar,      color: 'text-blue-600' },
          { label: 'No-Shows',        value: noShows ?? 0,          icon: XCircle,       color: 'text-red-600' },
          { label: 'Paid',            value: paidCount ?? 0,        icon: CheckCircle2,  color: 'text-green-600' },
          { label: 'Revenue (30d)',   value: fmtMoney(revenueThisMonth), icon: DollarSign, color: 'text-emerald-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming this week */}
      {(upcoming ?? []).length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-blue-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-blue-900 text-sm">Upcoming This Week ({upcoming!.length})</h2>
          </div>
          <div className="divide-y divide-blue-100">
            {upcoming!.map((b: any) => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {b.first_name} {b.last_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{b.exam_name}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {fmtDate(b.confirmed_date)}
                  </p>
                  <p className="text-xs text-slate-500">{b.confirmed_time ?? 'Time TBD'}</p>
                </div>
                {b.add_on && (
                  <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                    + Add-on
                  </span>
                )}
                <Link
                  href={`/admin/testing-center/${b.id}`}
                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter:</span>

        {/* Status */}
        <div className="flex gap-1.5 flex-wrap">
          {['', 'pending', 'confirmed', 'completed', 'no_show', 'cancelled'].map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s, page: '1' })}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s || 'All Status'}
            </Link>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* Payment */}
        <div className="flex gap-1.5 flex-wrap">
          {['', 'paid', 'unpaid'].map((p) => (
            <Link
              key={p}
              href={buildHref({ payment: p, page: '1' })}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                paymentFilter === p
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p || 'All Payments'}
            </Link>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* Exam type */}
        <select
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
          value={examFilter}
          onChange={() => {}}
          // Server-side — use Link navigation instead
        >
          <option value="">All Exams</option>
          {uniqueExams.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Bookings table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">
            Bookings
            {filteredCount != null && (
              <span className="ml-2 text-slate-400 font-normal">({filteredCount.toLocaleString()})</span>
            )}
          </h2>
          {(statusFilter || examFilter || paymentFilter) && (
            <Link href="/admin/testing-center" className="text-xs text-blue-600 hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium">Exam</th>
                  <th className="text-left px-4 py-3 font-medium">Preferred Date</th>
                  <th className="text-left px-4 py-3 font-medium">Confirmed</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-right px-4 py-3 font-medium">Fee</th>
                  <th className="text-left px-4 py-3 font-medium">Booked</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 whitespace-nowrap">
                        {b.first_name} {b.last_name}
                      </p>
                      <p className="text-xs text-slate-400">{b.email}</p>
                      {b.confirmation_code && (
                        <p className="text-xs text-slate-300 font-mono">{b.confirmation_code}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 whitespace-nowrap max-w-[180px] truncate">
                        {b.exam_name || b.exam_type}
                      </p>
                      {b.participant_count > 1 && (
                        <p className="text-xs text-slate-400">{b.participant_count} participants</p>
                      )}
                      {b.add_on && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.5 rounded-full">
                          + Add-on {b.add_on_paid ? '✓' : '(unpaid)'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {fmtDate(b.preferred_date)}
                      {b.preferred_time && <span className="text-slate-400 ml-1">{b.preferred_time}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {b.confirmed_date ? (
                        <>
                          {fmtDate(b.confirmed_date)}
                          {b.confirmed_time && <span className="text-slate-400 ml-1">{b.confirmed_time}</span>}
                        </>
                      ) : (
                        <span className="text-slate-300">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_STYLES[b.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {fmtMoney(b.fee_cents)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {timeSince(b.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/testing-center/${b.id}`}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildHref({ page: String(page - 1) })} className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50">
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildHref({ page: String(page + 1) })} className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
