import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { BookingActions } from './BookingActions';
import { ArrowLeft, User, CreditCard, Calendar, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Booking Detail | Testing Center | Admin' };

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtMoney(cents: number | null) {
  if (!cents) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
function fmtTs(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  confirmed:   'bg-blue-100 text-blue-800',
  completed:   'bg-green-100 text-green-800',
  no_show:     'bg-red-100 text-red-800',
  cancelled:   'bg-slate-100 text-slate-600',
  rescheduled: 'bg-purple-100 text-purple-800',
};

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: booking } = await db
    .from('exam_bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!booking) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/admin/testing-center" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Testing Center
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {booking.first_name} {booking.last_name}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{booking.exam_name || booking.exam_type}</p>
          {booking.confirmation_code && (
            <p className="text-xs font-mono text-slate-400 mt-1">#{booking.confirmation_code}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${STATUS_STYLES[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Candidate info */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 text-sm">Candidate</h2>
          </div>
          <dl className="px-5 py-4 space-y-3 text-sm">
            {[
              ['Name',         `${booking.first_name} ${booking.last_name}`],
              ['Email',        booking.email],
              ['Phone',        booking.phone || '—'],
              ['Organization', booking.organization || '—'],
              ['Booking Type', booking.booking_type],
              ['Participants', booking.participant_count],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Payment info */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 text-sm">Payment</h2>
          </div>
          <dl className="px-5 py-4 space-y-3 text-sm">
            {[
              ['Status',       booking.payment_status],
              ['Fee',          fmtMoney(booking.fee_cents)],
              ['Add-on',       booking.add_on ? (booking.add_on_paid ? 'Yes (paid)' : 'Yes (unpaid)') : 'No'],
              ['Stripe ID',    booking.payment_intent_id || '—'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className={`font-medium text-right ${label === 'Status' && booking.payment_status === 'paid' ? 'text-green-700' : label === 'Status' && booking.payment_status === 'unpaid' ? 'text-red-700' : 'text-slate-900'}`}>
                  {value}
                </dd>
              </div>
            ))}
            {booking.payment_intent_id && (
              <a
                href={`https://dashboard.stripe.com/payments/${booking.payment_intent_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View in Stripe →
              </a>
            )}
          </dl>
        </div>

        {/* Scheduling */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 text-sm">Scheduling</h2>
          </div>
          <dl className="px-5 py-4 space-y-3 text-sm">
            {[
              ['Preferred Date',  fmtDate(booking.preferred_date)],
              ['Preferred Time',  booking.preferred_time || '—'],
              ['Alternate Date',  fmtDate(booking.alternate_date)],
              ['Confirmed Date',  fmtDate(booking.confirmed_date)],
              ['Confirmed Time',  booking.confirmed_time || '—'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900 text-right">{value}</dd>
              </div>
            ))}
            {booking.calendly_scheduling_url && (
              <a
                href={booking.calendly_scheduling_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Calendly scheduling link →
              </a>
            )}
          </dl>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 text-sm">Notes</h2>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            {booking.notes && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Candidate notes</p>
                <p className="text-slate-700">{booking.notes}</p>
              </div>
            )}
            {booking.admin_notes && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Admin notes</p>
                <p className="text-slate-700">{booking.admin_notes}</p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
              <p>Created: {fmtTs(booking.created_at)}</p>
              <p>Updated: {fmtTs(booking.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <BookingActions booking={booking} />
    </div>
  );
}
