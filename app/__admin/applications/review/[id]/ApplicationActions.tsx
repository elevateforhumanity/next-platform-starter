'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Program {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  applicationId: string;
  currentStatus: string;
  programId: string | null;
  programInterest: string;
}

export default function ApplicationActions({
  applicationId,
  currentStatus,
  programId: initialProgramId,
  programInterest,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resolvedProgramId, setResolvedProgramId] = useState<string | null>(initialProgramId);

  // Program assignment state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [showProgramPicker, setShowProgramPicker] = useState(false);

  const router = useRouter();

  // Load programs list when picker is opened
  useEffect(() => {
    if (!showProgramPicker || programs.length > 0) return;
    fetch('/api/admin/programs', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const list: Program[] = (d.data ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
        }));
        list.sort((a, b) => a.title.localeCompare(b.title));
        setPrograms(list);
        // Pre-select closest match on slug or title
        const match = list.find(p =>
          p.slug === programInterest ||
          p.title.toLowerCase().includes(programInterest.toLowerCase())
        );
        if (match) setSelectedProgramId(match.id);
      })
      .catch(() => {});
  }, [showProgramPicker, programs.length, programInterest]);

  const handleAssignProgram = async () => {
    if (!selectedProgramId) return;
    setLoading('assign');
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: selectedProgramId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign program');
      setResolvedProgramId(selectedProgramId);
      setShowProgramPicker(false);
      setSuccess('Program assigned. You can now approve and enroll.');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign program');
    } finally {
      setLoading(null);
    }
  };

  // Terminal states
  if (currentStatus === 'approved' || currentStatus === 'converted' || currentStatus === 'enrolled') {
    return (
      <div className="text-sm text-brand-green-700 bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
        This application has been approved. The student account and enrollment have been created.
      </div>
    );
  }
  if (currentStatus === 'rejected') {
    return (
      <div className="text-sm text-brand-red-700 bg-brand-red-50 border border-brand-red-200 rounded-lg p-3">
        This application has been rejected.
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading('approve');
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: resolvedProgramId,
          funding_type: null,
          source: 'admin-review',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve application');
      setSuccess(
        data.enrollment_id
          ? `Approved and enrolled. (enrollment ${data.enrollment_id?.slice(0, 8)}...)`
          : `Approved. No program assigned — enrollment skipped.`
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(newStatus);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update application');
      }
      setSuccess(`Application ${newStatus === 'rejected' ? 'rejected' : 'updated'}.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Program assignment — shown when no program is linked */}
      {!resolvedProgramId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs text-amber-700 font-medium">
            No program matched for &ldquo;{programInterest}&rdquo;. Assign a program to enable enrollment.
          </p>
          {!showProgramPicker ? (
            <button
              onClick={() => setShowProgramPicker(true)}
              className="text-xs font-semibold text-amber-800 underline hover:text-amber-900"
            >
              Assign program manually
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={selectedProgramId}
                onChange={e => setSelectedProgramId(e.target.value)}
                className="flex-1 min-w-[200px] text-xs border border-amber-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">— Select a program —</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <button
                onClick={handleAssignProgram}
                disabled={!selectedProgramId || loading === 'assign'}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors"
              >
                {loading === 'assign' ? 'Saving…' : 'Assign'}
              </button>
              <button
                onClick={() => setShowProgramPicker(false)}
                className="text-xs text-amber-700 hover:text-amber-900"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {(currentStatus === 'pending' || currentStatus === 'submitted') ? (
          <>
            <button
              onClick={() => handleStatusChange('in_review')}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'in_review' ? 'Updating...' : 'Start Review'}
            </button>
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'approve' ? 'Approving...' : 'Approve & Enroll'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-red-600 hover:bg-brand-red-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        ) : (
          <>
            {currentStatus !== 'in_review' && (
              <button
                onClick={() => handleStatusChange('in_review')}
                disabled={loading !== null}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {loading === 'in_review' ? 'Updating...' : 'Start Review'}
              </button>
            )}
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'approve' ? 'Approving...' : 'Approve & Enroll'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-red-600 hover:bg-brand-red-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-brand-red-600">{error}</p>}
      {success && <p className="text-sm text-brand-green-600">{success}</p>}
    </div>
  );
}
