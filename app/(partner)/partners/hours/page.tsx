'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HourEntry {
  id: string;
  user_id: string;
  work_date: string;
  hours_claimed: number;
  source_type: string;
  category: string;
  notes: string | null;
  status: string;
  entered_by_email: string;
  program_slug: string;
}

export default function PartnerHoursApprovalPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPendingEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPendingEntries() {
    setLoading(true);
    if (!supabase) return;

    // Get the partner's assigned program slugs via program_holders
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: holders } = await supabase
      .from('program_holders')
      .select('id')
      .eq('email', user.email);

    if (!holders || holders.length === 0) {
      setLoading(false);
      return;
    }

    const holderIds = holders.map((h: any) => h.id);

    // Load pending hour entries for apprentices under this program holder
    const { data, error } = await supabase
      .from('hour_entries')
      .select('id, user_id, work_date, hours_claimed, source_type, category, notes, status, entered_by_email, program_slug')
      .eq('status', 'pending')
      .in('program_holder_id', holderIds)
      .order('work_date', { ascending: false });

    if (error) {
      setMsg('Failed to load pending entries: ' + error.message);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  }

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    setProcessing(id);
    setMsg(null);
    try {
      const res = await fetch('/api/apprenticeship/hours/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour_id: id, action }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMsg(result.error || 'Action failed');
      } else {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setMsg(`Entry ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      }
    } catch {
      setMsg('Network error — please try again.');
    } finally {
      setProcessing(null);
    }
  }

  const sourceLabel = (s: string) => s === 'ojl' ? 'On-the-Job' : 'Related Training';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <Link href="/partners/dashboard" className="hover:text-slate-700">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Hour Approvals</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Pending Hour Approvals</h1>
        <p className="text-slate-500 text-sm mb-6">
          Review and approve or reject apprentice-submitted hours before they count toward program totals.
        </p>

        {msg && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            {msg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">All caught up</p>
            <p className="text-slate-500 text-sm mt-1">No pending hour entries to review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-900">
                      {entry.hours_claimed}h — {sourceLabel(entry.source_type)}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {entry.program_slug}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {new Date(entry.work_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}
                    {entry.entered_by_email}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-slate-600 mt-1 italic">"{entry.notes}"</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDecision(entry.id, 'approve')}
                    disabled={processing === entry.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(entry.id, 'reject')}
                    disabled={processing === entry.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
