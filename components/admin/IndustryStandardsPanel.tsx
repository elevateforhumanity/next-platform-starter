'use client';

/**
 * IndustryStandardsPanel
 *
 * Shows live O*NET + BLS + CareerOneStop data for a SOC code.
 * Displayed in the course builder before AI generation so the admin
 * can see exactly what industry data will be injected into the prompt.
 *
 * Usage:
 *   <IndustryStandardsPanel socCode="21-1093.00" credentialCode="ICRC-PRS" />
 */

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Briefcase,
  TrendingUp,
  DollarSign,
  Award,
  Wrench,
  BookOpen,
} from 'lucide-react';
import type { IndustryStandards } from '@/lib/industry/standards-loader';
import { PROGRAM_SOC_CODES } from '@/lib/industry/onet';

interface Props {
  programSlug?: string;
  socCode?: string;
  credentialCode?: string;
  onStandardsLoaded?: (standards: IndustryStandards | null) => void;
}

type Status = 'idle' | 'loading' | 'loaded' | 'error';

export default function IndustryStandardsPanel({
  programSlug,
  socCode: propSocCode,
  credentialCode,
  onStandardsLoaded,
}: Props) {
  const [socCode, setSocCode] = useState(
    propSocCode ?? (programSlug ? PROGRAM_SOC_CODES[programSlug] : '') ?? '',
  );
  const [credCode, setCredCode] = useState(credentialCode ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [standards, setStandards] = useState<IndustryStandards | null>(null);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-load cache status on mount
  useEffect(() => {
    if (!socCode) return;
    fetch(`/api/admin/industry/refresh-standards?soc_code=${encodeURIComponent(socCode)}`)
      .then((r) => r.json())
      .then((d) => setCacheInfo(d))
      .catch(() => {});
  }, [socCode]);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const refresh = async (force = false) => {
    if (!socCode) return;
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/admin/industry/refresh-standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soc_code: socCode, credential_code: credCode || null, force }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message ?? data.error ?? 'Fetch failed');
        setStatus('error');
        return;
      }

      setStandards(data.standards);
      onStandardsLoaded?.(data.standards);
      setStatus('loaded');
    } catch (err: any) {
      setError(err.message ?? 'Network error');
      setStatus('error');
    }
  };

  const isFresh = cacheInfo?.is_fresh;
  const fmt = (n: number | null) => (n ? `$${n.toLocaleString()}` : '—');

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-800">Industry Standards</span>
          {isFresh && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Cached
            </span>
          )}
          {!isFresh && cacheInfo && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Stale
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={socCode}
            onChange={(e) => setSocCode(e.target.value)}
            placeholder="SOC code (e.g. 21-1093.00)"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
          <input
            value={credCode}
            onChange={(e) => setCredCode(e.target.value)}
            placeholder="Credential code (e.g. ICRC-PRS)"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-44 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => (isFresh ? refresh(false) : refresh(true))}
            disabled={!socCode || status === 'loading'}
            className="flex items-center gap-1.5 bg-brand-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-blue-700 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
            {status === 'loading' ? 'Fetching…' : isFresh ? 'Use Cached' : 'Fetch Live'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Fetch failed</p>
            <p className="text-xs mt-0.5">{error}</p>
            <p className="text-xs mt-1 text-red-600">
              Check ONET_USERNAME, ONET_PASSWORD, and BLS_API_KEY in environment.
            </p>
          </div>
        </div>
      )}

      {/* Idle state */}
      {status === 'idle' && !error && (
        <div className="px-4 py-6 text-center text-sm text-slate-400">
          <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Enter a SOC code and fetch industry standards.</p>
          <p className="text-xs mt-1">
            Data from O*NET, BLS, and CareerOneStop will be injected into the AI prompt.
          </p>
          {Object.keys(PROGRAM_SOC_CODES).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {Object.entries(PROGRAM_SOC_CODES)
                .slice(0, 8)
                .map(([slug, soc]) => (
                  <button
                    key={slug}
                    onClick={() => setSocCode(soc)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-colors"
                  >
                    {slug.replace(/-/g, ' ')}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Loaded state */}
      {standards && status === 'loaded' && (
        <div className="divide-y divide-slate-100">
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-slate-100">
            {[
              {
                icon: DollarSign,
                label: 'Indiana Median',
                value: fmt(standards.indiana_median_wage ?? standards.median_annual_wage) + '/yr',
              },
              {
                icon: TrendingUp,
                label: 'Job Growth',
                value: standards.projected_growth_cat ?? '—',
              },
              {
                icon: Briefcase,
                label: 'Core Tasks',
                value: `${standards.top_tasks.length} tasks`,
              },
              {
                icon: Award,
                label: 'Exam Domains',
                value:
                  standards.credential_domains.length > 0
                    ? `${standards.credential_domains.length} domains`
                    : 'None',
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="px-4 py-3 text-center">
                <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Credential domains — most important */}
          {standards.credential_domains.length > 0 && (
            <div>
              <button
                onClick={() => toggle('domains')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-blue-600" />
                  Credential Exam Domains ({standards.credential_code})
                  <span className="text-xs font-normal text-slate-500">
                    — AI will structure modules around these
                  </span>
                </span>
                {expanded.domains ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expanded.domains && (
                <div className="px-4 pb-4 space-y-3">
                  {standards.credential_domains.map((d) => (
                    <div key={d.key} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-slate-900">{d.name}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {d.weight_pct}% of exam
                          </span>
                          <span>{d.min_hours}h min</span>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {d.competencies.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Core job tasks */}
          {standards.top_tasks.length > 0 && (
            <div>
              <button
                onClick={() => toggle('tasks')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  Core Job Tasks (O*NET)
                  <span className="text-xs font-normal text-slate-500">
                    — what workers actually do
                  </span>
                </span>
                {expanded.tasks ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expanded.tasks && (
                <ol className="px-4 pb-4 space-y-1.5">
                  {standards.top_tasks.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="shrink-0 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-medium">
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Skills + Knowledge */}
          {(standards.top_skills.length > 0 || standards.top_knowledge.length > 0) && (
            <div>
              <button
                onClick={() => toggle('skills')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  Skills & Knowledge (O*NET)
                </span>
                {expanded.skills ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expanded.skills && (
                <div className="px-4 pb-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {standards.top_skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Knowledge Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {standards.top_knowledge.map((k) => (
                        <span
                          key={k}
                          className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technology tools */}
          {standards.technology_skills.length > 0 && (
            <div>
              <button
                onClick={() => toggle('tech')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-slate-500" />
                  Technology Tools Used
                </span>
                {expanded.tech ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expanded.tech && (
                <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                  {standards.technology_skills.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certifications */}
          {standards.certifications.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">Available Certifications</p>
              <div className="space-y-1">
                {standards.certifications.slice(0, 6).map((c, i) => (
                  <p key={i} className="text-xs text-slate-700">
                    <span className="font-medium">{c.name}</span>
                    {c.organization && <span className="text-slate-500"> — {c.organization}</span>}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Source footer */}
          <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span>Sources: {standards.sources.join(', ')}</span>
            <span>
              {standards.is_cached ? 'From cache' : 'Live fetch'} ·{' '}
              {new Date(standards.fetched_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
