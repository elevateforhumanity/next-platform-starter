'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

interface BookingActionsProps {
  booking: {
    id: string;
    status: string;
    payment_status: string;
    confirmed_date?: string | null;
    confirmed_time?: string | null;
    admin_notes?: string | null;
  };
}

export function BookingActions({ booking }: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmedDate, setConfirmedDate] = useState(booking.confirmed_date ?? '');
  const [confirmedTime, setConfirmedTime] = useState(booking.confirmed_time ?? '');
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes ?? '');

  async function update(status: string) {
    setLoading(status);
    setError(null);
    try {
      const res = await fetch(`/api/testing/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, confirmedDate, confirmedTime, adminNotes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900 text-sm">Actions</h2>
      </div>
      <div className="px-5 py-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Date/time confirmation */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirmed Date</label>
            <input
              type="date"
              value={confirmedDate}
              onChange={(e) => setConfirmedDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirmed Time</label>
            <input
              type="time"
              value={confirmedTime}
              onChange={(e) => setConfirmedTime(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Admin notes */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Admin Notes</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes — not visible to candidate"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => update('confirmed')}
            disabled={!!loading || booking.status === 'confirmed'}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {loading === 'confirmed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm
          </button>
          <button
            onClick={() => update('completed')}
            disabled={!!loading || booking.status === 'completed'}
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {loading === 'completed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Mark Completed
          </button>
          <button
            onClick={() => update('no_show')}
            disabled={!!loading || booking.status === 'no_show'}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {loading === 'no_show' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            No-Show
          </button>
          <button
            onClick={() => update('rescheduled')}
            disabled={!!loading}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {loading === 'rescheduled' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reschedule
          </button>
          <button
            onClick={() => update('cancelled')}
            disabled={!!loading || booking.status === 'cancelled'}
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {loading === 'cancelled' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
