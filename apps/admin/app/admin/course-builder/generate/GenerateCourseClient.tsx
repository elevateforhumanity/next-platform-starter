'use client';

import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface GenerateForm {
  courseName: string;
  state: string;
  credentialTarget: string;
  moduleCount: number;
  lessonsPerModule: number;
  includeCheckpoints: boolean;
  includeFinalExam: boolean;
  programSlug: string;
}

const DEFAULTS: GenerateForm = {
  courseName: '',
  state: 'IN',
  credentialTarget: 'STATE_BOARD',
  moduleCount: 6,
  lessonsPerModule: 5,
  includeCheckpoints: true,
  includeFinalExam: true,
  programSlug: '',
};

export function GenerateCourseClient() {
  const [form, setForm] = useState<GenerateForm>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    blueprint: Record<string, unknown>;
    meta: Record<string, unknown>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  function set<K extends keyof GenerateForm>(key: K, value: GenerateForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleGenerate() {
    if (!form.courseName.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          programSlug:
            form.programSlug || form.courseName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function downloadBlueprint() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.blueprint, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.blueprint.id ?? 'blueprint'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleModule(i: number) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const modules = result?.blueprint?.modules as Array<Record<string, unknown>> | undefined;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-400" />
          AI Course Generator
        </h1>
        <p className="text-slate-400 mt-1">
          Generate a workforce-ready, SAMHSA-aligned course blueprint. Review the output, then seed
          it to the database.
        </p>
      </div>

      {/* Form */}
      <div className="bg-slate-800 rounded-xl p-6 space-y-5 border border-slate-700">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Course Name *</label>
          <input
            type="text"
            value={form.courseName}
            onChange={(e) => set('courseName', e.target.value)}
            placeholder="e.g. Peer Recovery Specialist"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
            <select
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {['IN', 'IL', 'OH', 'KY', 'MI', 'TN', 'GA', 'FL', 'TX', 'CA'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Credential Target
            </label>
            <select
              value={form.credentialTarget}
              onChange={(e) => set('credentialTarget', e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="STATE_BOARD">State Board</option>
              <option value="IC&RC">IC&RC</option>
              <option value="NAADAC">NAADAC</option>
              <option value="INTERNAL">Internal / CEU</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Modules</label>
            <input
              type="number"
              min={4}
              max={10}
              value={form.moduleCount}
              onChange={(e) => set('moduleCount', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Lessons per Module
            </label>
            <input
              type="number"
              min={3}
              max={8}
              value={form.lessonsPerModule}
              onChange={(e) => set('lessonsPerModule', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Program Slug (optional)
          </label>
          <input
            type="text"
            value={form.programSlug}
            onChange={(e) => set('programSlug', e.target.value)}
            placeholder="auto-generated from course name"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.includeCheckpoints}
              onChange={(e) => set('includeCheckpoints', e.target.checked)}
              className="rounded border-slate-600 bg-slate-900 text-orange-500"
            />
            Checkpoint quiz per module
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.includeFinalExam}
              onChange={(e) => set('includeFinalExam', e.target.checked)}
              className="rounded border-slate-600 bg-slate-900 text-orange-500"
            />
            Final exam
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !form.courseName.trim()}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Generating course — this takes 30–60
              seconds…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Generate Course Blueprint
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Blueprint generated</span>
              <span className="text-slate-400 text-sm">
                · {modules?.length ?? 0} modules ·{' '}
                {(result.meta as Record<string, unknown>).tokensUsed as number} tokens
              </span>
            </div>
            <button
              onClick={downloadBlueprint}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </button>
          </div>

          {/* Next step instruction */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 font-mono">
            <p className="text-slate-400 mb-1">Next step — seed to database:</p>
            <p className="text-orange-300">
              {(result.meta as Record<string, unknown>).nextStep as string}
            </p>
          </div>

          {/* Module preview */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700 text-sm font-medium text-slate-300">
              Course Structure Preview
            </div>
            {modules?.map((mod, i) => {
              const lessons = mod.lessons as Array<Record<string, unknown>> | undefined;
              const expanded = expandedModules.has(i);
              return (
                <div key={i} className="border-b border-slate-700 last:border-0">
                  <button
                    onClick={() => toggleModule(i)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-700/50 transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-slate-200 font-medium">{mod.title as string}</span>
                    <span className="ml-auto text-slate-500 text-sm">
                      {lessons?.length ?? 0} lessons
                    </span>
                  </button>
                  {expanded && lessons && (
                    <div className="px-5 pb-3 space-y-1">
                      {lessons.map((lesson, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 text-sm text-slate-400 py-1 pl-7"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              (lesson.slug as string)?.endsWith('-checkpoint')
                                ? 'bg-blue-400'
                                : (lesson.slug as string)?.endsWith('-exam')
                                  ? 'bg-purple-400'
                                  : 'bg-slate-500'
                            }`}
                          />
                          <span>{lesson.title as string}</span>
                          <span className="ml-auto text-slate-600">
                            {lesson.durationMinutes as number}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
