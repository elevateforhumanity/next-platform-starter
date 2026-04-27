'use client';

import { useState } from 'react';
import {
  Award,
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  User,
  Calendar,
  Hash,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CertResult {
  id: string;
  certificate_number: string | null;
  issued_at: string | null;
  completion_date: string | null;
  verification_url: string | null;
  checkpoints_passed: number | null;
  total_checkpoints: number | null;
  student_name: string | null;
  student_email: string | null;
  program_title: string | null;
  source: 'program_completion' | 'external';
  // external certs only
  issuer?: string | null;
  expiry_date?: string | null;
  is_active?: boolean;
}

export function CredentialVerificationPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CertResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const supabase = createClient();
      const found: CertResult[] = [];

      // 1. Search program_completion_certificates by certificate_number
      const { data: byNumber } = await supabase
        .from('program_completion_certificates')
        .select(
          'id, certificate_number, issued_at, completion_date, verification_url, checkpoints_passed, total_checkpoints, user_id, program_id',
        )
        .ilike('certificate_number', `%${q}%`)
        .limit(20);

      // 2. Search by student email/name via profiles
      const { data: matchingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(20);

      const profileIds = (matchingProfiles ?? []).map((p: any) => p.id);
      const profileMap = Object.fromEntries((matchingProfiles ?? []).map((p: any) => [p.id, p]));

      let byStudent: any[] = [];
      if (profileIds.length > 0) {
        const { data } = await supabase
          .from('program_completion_certificates')
          .select(
            'id, certificate_number, issued_at, completion_date, verification_url, checkpoints_passed, total_checkpoints, user_id, program_id',
          )
          .in('user_id', profileIds)
          .limit(20);
        byStudent = data ?? [];
      }

      // Merge, deduplicate by id
      const allCerts = [...(byNumber ?? []), ...byStudent];
      const seen = new Set<string>();
      const uniqueCerts = allCerts.filter((c: any) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      // Hydrate program titles
      const programIds = [...new Set(uniqueCerts.map((c: any) => c.program_id).filter(Boolean))];
      const { data: programs } = programIds.length
        ? await supabase.from('programs').select('id, title').in('id', programIds)
        : { data: [] };
      const programMap = Object.fromEntries((programs ?? []).map((p: any) => [p.id, p]));

      // Hydrate profiles for byNumber results (may not be in profileMap)
      const missingProfileIds = uniqueCerts
        .map((c: any) => c.user_id)
        .filter((id: string) => id && !profileMap[id]);
      if (missingProfileIds.length > 0) {
        const { data: extra } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', missingProfileIds);
        for (const p of extra ?? []) profileMap[(p as any).id] = p;
      }

      for (const c of uniqueCerts) {
        const profile = profileMap[c.user_id];
        const program = programMap[c.program_id];
        found.push({
          id: c.id,
          certificate_number: c.certificate_number,
          issued_at: c.issued_at,
          completion_date: c.completion_date,
          verification_url: c.verification_url,
          checkpoints_passed: c.checkpoints_passed,
          total_checkpoints: c.total_checkpoints,
          student_name: profile?.full_name ?? null,
          student_email: profile?.email ?? null,
          program_title: program?.title ?? null,
          source: 'program_completion',
        });
      }

      // 3. Search external certifications table
      const { data: extCerts } = await supabase
        .from('certifications')
        .select(
          'id, name, issuer, credential_id, issue_date, expiry_date, is_active, verification_url, user_id',
        )
        .or(
          profileIds.length > 0
            ? `credential_id.ilike.%${q}%,user_id.in.(${profileIds.join(',')})`
            : `credential_id.ilike.%${q}%`,
        )
        .limit(20);

      for (const c of extCerts ?? []) {
        const profile = profileMap[(c as any).user_id] ?? null;
        found.push({
          id: (c as any).id,
          certificate_number: (c as any).credential_id,
          issued_at: (c as any).issue_date,
          completion_date: null,
          verification_url: (c as any).verification_url,
          checkpoints_passed: null,
          total_checkpoints: null,
          student_name: profile?.full_name ?? null,
          student_email: profile?.email ?? null,
          program_title: (c as any).name,
          source: 'external',
          issuer: (c as any).issuer,
          expiry_date: (c as any).expiry_date,
          is_active: (c as any).is_active,
        });
      }

      setResults(found);
    } catch (e: any) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-blue-600" />
          Credential Verification
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Search by certificate number, student name, or email
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Certificate number, student name, or email…"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {searched && (
        <div className="border-t border-slate-100">
          {results.length === 0 ? (
            <div className="py-10 text-center">
              <XCircle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No credentials found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try a different certificate number, name, or email
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {results.map((r) => {
                const isExpired = r.expiry_date ? new Date(r.expiry_date) < new Date() : false;
                const isValid =
                  r.source === 'program_completion' ? true : r.is_active !== false && !isExpired;

                return (
                  <div key={r.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isValid ? 'bg-green-100' : 'bg-red-100'}`}
                        >
                          {isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {r.program_title ?? 'Credential'}
                          </p>
                          {r.source === 'external' && r.issuer && (
                            <p className="text-xs text-slate-500">Issued by {r.issuer}</p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {r.student_name && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <User className="w-3 h-3" />
                                {r.student_name}
                                {r.student_email && (
                                  <span className="text-slate-400">· {r.student_email}</span>
                                )}
                              </span>
                            )}
                            {r.certificate_number && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Hash className="w-3 h-3" />
                                {r.certificate_number}
                              </span>
                            )}
                            {(r.issued_at || r.completion_date) && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" />
                                Issued{' '}
                                {new Date(r.issued_at ?? r.completion_date!).toLocaleDateString()}
                              </span>
                            )}
                            {r.expiry_date && (
                              <span
                                className={`flex items-center gap-1 text-xs ${isExpired ? 'text-red-600 font-semibold' : 'text-slate-500'}`}
                              >
                                <Calendar className="w-3 h-3" />
                                {isExpired ? 'Expired' : 'Expires'}{' '}
                                {new Date(r.expiry_date).toLocaleDateString()}
                              </span>
                            )}
                            {r.checkpoints_passed != null && r.total_checkpoints != null && (
                              <span className="text-xs text-slate-500">
                                {r.checkpoints_passed}/{r.total_checkpoints} checkpoints
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isValid ? 'VALID' : 'INVALID'}
                        </span>
                        {r.source === 'program_completion' && (
                          <a
                            href={`/verify/${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                          >
                            Public page <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {r.verification_url && r.source === 'external' && (
                          <a
                            href={r.verification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                          >
                            Verify <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
