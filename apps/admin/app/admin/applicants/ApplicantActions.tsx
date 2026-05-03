'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import { updateApplicationStatus } from './actions';

interface Props {
  applicationId: string;
  currentStatus: string;
  applicantName: string;
}

const TRANSITIONS: Record<string, { label: string; next: string; icon: React.ReactNode; style: string }[]> = {
  submitted: [
    { label: 'Mark Under Review', next: 'under_review', icon: <Clock className="w-3.5 h-3.5" />, style: 'text-blue-700 hover:bg-blue-50' },
    { label: 'Approve', next: 'approved', icon: <CheckCircle className="w-3.5 h-3.5" />, style: 'text-green-700 hover:bg-green-50' },
    { label: 'Deny', next: 'denied', icon: <XCircle className="w-3.5 h-3.5" />, style: 'text-red-700 hover:bg-red-50' },
  ],
  under_review: [
    { label: 'Approve', next: 'approved', icon: <CheckCircle className="w-3.5 h-3.5" />, style: 'text-green-700 hover:bg-green-50' },
    { label: 'Deny', next: 'denied', icon: <XCircle className="w-3.5 h-3.5" />, style: 'text-red-700 hover:bg-red-50' },
  ],
  approved: [
    { label: 'Revert to Review', next: 'under_review', icon: <Clock className="w-3.5 h-3.5" />, style: 'text-blue-700 hover:bg-blue-50' },
  ],
  denied: [
    { label: 'Reopen', next: 'under_review', icon: <Clock className="w-3.5 h-3.5" />, style: 'text-blue-700 hover:bg-blue-50' },
  ],
};

export function ApplicantActions({ applicationId, currentStatus, applicantName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const actions = TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  async function handleAction(next: string) {
    setLoading(true);
    setOpen(false);
    const result = await updateApplicationStatus(applicationId, next as any);
    if (!result.success) alert(`Failed to update ${applicantName}: ${result.error}`);
    setLoading(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Update'}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
            {actions.map((a) => (
              <button
                key={a.next}
                onClick={() => handleAction(a.next)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition ${a.style}`}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
