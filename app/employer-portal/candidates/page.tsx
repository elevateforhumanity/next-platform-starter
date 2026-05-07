'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Loader2, ChevronRight } from 'lucide-react';
import { CandidatesClient } from './CandidatesClient';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/employer/matches?mode=candidates_for_job');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to load candidates');
        return;
      }
      const data = await res.json();
      // Normalize to CandidatesClient shape
      const normalized = (data.candidates ?? data ?? []).map((c: any) => ({
        id: c.id ?? c.user_id,
        name: c.full_name ?? c.name ?? 'Unknown',
        title: c.credential ?? c.program ?? c.title ?? '',
        location: c.location ?? c.city ?? '',
        experience: c.experience ?? '',
        program: c.program ?? c.credential ?? '',
        graduated: c.completed_at ? new Date(c.completed_at).toLocaleDateString() : '',
        available: c.available ?? true,
        image: c.avatar_url ?? null,
      }));
      setCandidates(normalized);
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Link href="/employer-portal" className="hover:text-gray-700">Employer Portal</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium">Candidates</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-brand-blue-600" /> Matched Candidates
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Graduates and learners matched to your open positions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchCandidates}
              className="mt-3 text-sm text-brand-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <CandidatesClient candidates={candidates} />
        )}
      </div>
    </div>
  );
}
