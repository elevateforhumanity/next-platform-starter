'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Auth-gated via middleware — noindex set in app/ai/layout.tsx
export default function GenerateAssetPage() {
  const [courseTitle, setCourseTitle] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [duration, setDuration] = useState(5);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setLoading(true);
    setError('');
    setScript('');
    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseTitle, moduleTitle, moduleDescription, duration }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Generation failed.'); return; }
      setScript(data.script ?? data.content ?? '');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!script) return;
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: 'AI Tools', href: '/ai' }, { label: 'Generate Script', href: '/ai/generate-asset' }]} />

        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Generate Lesson Script</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Generate a professional video lesson script. Provide the module details and target duration.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Course Title <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g. HVAC Technician Certification"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Module / Lesson Title <span className="text-red-500">*</span>
            </label>
            <input type="text" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g. Refrigerant Recovery Procedures" required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)}
              placeholder="Key learning outcomes and topics to cover." rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Duration</label>
            <div className="flex items-center gap-3">
              <input type="range" min={2} max={15} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 accent-violet-600" />
              <span className="text-sm font-semibold text-slate-700 w-16 text-right">{duration} min</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">~{duration * 150} words</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <button type="submit" disabled={loading || !moduleTitle.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate Script</>}
          </button>
        </form>

        {script && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Generated Script</span>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                {copied ? <><Check className="w-3.5 h-3.5 text-green-500" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
              </button>
            </div>
            <div className="p-5">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{script}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
