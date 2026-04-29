'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface CheckResult {
  label: string;
  status: 'pass' | 'fail' | 'pending';
  detail?: string;
}

export function DemoQAClient() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);

  async function runChecks() {
    setRunning(true);
    const checks: CheckResult[] = [];

    const routes = [
      { label: 'Admin Dashboard', path: '/demo/admin' },
      { label: 'Employer Portal', path: '/demo/employer' },
      { label: 'Learner Portal', path: '/demo/learner' },
      { label: 'Store', path: '/store' },
    ];

    for (const route of routes) {
      try {
        const res = await fetch(route.path, { method: 'HEAD' });
        checks.push({
          label: route.label,
          status: res.ok ? 'pass' : 'fail',
          detail: `${res.status}`,
        });
      } catch {
        checks.push({ label: route.label, status: 'fail', detail: 'Network error' });
      }
    }

    setResults(checks);
    setRunning(false);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={runChecks}
        disabled={running}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {running ? 'Running checks…' : 'Run QA Checks'}
      </button>

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.label} className="flex items-center gap-3 text-sm">
              {r.status === 'pass' ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className="font-medium text-slate-800">{r.label}</span>
              {r.detail && <span className="text-slate-500">{r.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
