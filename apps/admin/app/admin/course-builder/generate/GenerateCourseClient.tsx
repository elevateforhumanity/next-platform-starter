'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Rocket,
  Activity,
  Database,
  Wrench,
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

interface LiveFeedCourse {
  id: string;
  title: string | null;
  slug: string | null;
  status: string | null;
  created_at: string | null;
  moduleCount: number;
  lessonCount: number;
  videoPending: number;
  videoComplete: number;
  queuedJobs: number;
}

interface MigrationCheckResponse {
  success?: boolean;
  requiresManual?: boolean;
  message?: string;
  results?: Array<{ migration: string; status: string; error?: string }>;
}

interface ScormPackage {
  id: string;
  title: string | null;
  course_id: string | null;
  status: string | null;
  created_at: string | null;
  launch_url: string | null;
}

/* eslint-disable no-control-regex */
function stripAnsi(value: string) {
  return value.replace(/\x1b\[[0-9;]*m/g, '');
}
/* eslint-enable no-control-regex */

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
  const [building, setBuilding] = useState(false);
  const [programId, setProgramId] = useState('');
  const [programs, setPrograms] = useState<Array<{ id: string; title: string; slug?: string | null }>>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [result, setResult] = useState<{
    blueprint: Record<string, unknown>;
    meta: Record<string, unknown>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [liveCourses, setLiveCourses] = useState<LiveFeedCourse[]>([]);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  const [migrationState, setMigrationState] = useState<MigrationCheckResponse | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autopilotLog, setAutopilotLog] = useState<string[]>([]);
  const [scormPackages, setScormPackages] = useState<ScormPackage[]>([]);
  const [scormLoading, setScormLoading] = useState(false);
  const [selectedScormPackageId, setSelectedScormPackageId] = useState('');
  const [selectedScormCourseId, setSelectedScormCourseId] = useState('');
  const [scormLinking, setScormLinking] = useState(false);

  function set<K extends keyof GenerateForm>(key: K, value: GenerateForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    let active = true;
    async function loadPrograms() {
      setProgramsLoading(true);
      try {
        const res = await fetch('/api/admin/programs');
        const json = await res.json().catch(() => ({ data: [] }));
        if (!res.ok || !Array.isArray(json?.data)) {
          if (active) setPrograms([]);
          return;
        }
        if (!active) return;
        const mapped = json.data
          .map((p: any) => ({
            id: String(p.id ?? ''),
            title: String(p.title ?? p.name ?? p.slug ?? 'Untitled Program'),
            slug: p.slug ?? null,
          }))
          .filter((p: { id: string }) => p.id.length > 0)
          .sort((a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title));
        setPrograms(mapped);
      } catch {
        if (active) setPrograms([]);
      } finally {
        if (active) setProgramsLoading(false);
      }
    }
    loadPrograms();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    async function loadScormPackages() {
      setScormLoading(true);
      try {
        const res = await fetch('/api/admin/course-builder/scorm-link');
        const data = await res.json();
        if (res.ok && Array.isArray(data.packages)) {
          setScormPackages(data.packages);
        }
      } finally {
        setScormLoading(false);
      }
    }

    loadScormPackages();
  }, []);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loadFeed = async () => {
      try {
        setLiveLoading(true);
        const res = await fetch('/api/admin/course-builder/live-feed?limit=20');
        const data = await res.json();
        if (!mounted) return;

        if (res.ok) {
          setLiveCourses(Array.isArray(data.courses) ? data.courses : []);
          setLiveTimestamp(String(data.timestamp ?? ''));
          setSupabaseOk(Boolean(data.supabase?.ok));
          setMigrationState({
            success: Boolean(data.migrations?.ok),
            message: data.migrations?.ok ? 'Migration health looks good' : 'Migration follow-up needed',
            results: Array.isArray(data.migrations?.results)
              ? data.migrations.results.map((r: { table: string; status: string }) => ({
                  migration: r.table,
                  status: r.status,
                }))
              : [],
          });
        }
      } catch {
        if (mounted) {
          setSupabaseOk(false);
        }
      } finally {
        if (mounted) {
          setLiveLoading(false);
          timer = setTimeout(loadFeed, 5000);
        }
      }
    };

    loadFeed();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

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

  async function handleBuildFullPremiumCourse() {
    if (!programId.trim()) {
      setError('Program ID is required to run one-click course build.');
      return;
    }

    setBuilding(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/programs/${encodeURIComponent(programId.trim())}/auto-generate-course`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'missing-only',
            videoMode: 'queue',
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Auto-generation failed');
      }

      const command = `Auto-generated course ${data.courseId ?? 'unknown'} for program ${programId.trim()} using blueprint ${data.blueprintId ?? 'unknown'} with queued videos`;
      const studioUrl = `/admin/dev-studio?tab=command&command=${encodeURIComponent(command)}`;
      window.location.href = studioUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-generation failed');
    } finally {
      setBuilding(false);
    }
  }

  async function runMigrationCheck() {
    setAutopilotLog((prev) => [...prev, '$ POST /api/admin/run-migrations']);
    try {
      const res = await fetch('/api/admin/run-migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as MigrationCheckResponse;
      if (!res.ok) {
        throw new Error(data.message || 'Migration check failed');
      }
      setMigrationState(data);
      setAutopilotLog((prev) => [...prev, `✓ ${data.message ?? 'Migration check complete'}`]);
    } catch (err) {
      setAutopilotLog((prev) => [
        ...prev,
        `✗ ${err instanceof Error ? err.message : 'Migration check failed'}`,
      ]);
    }
  }

  async function runAutopilotCommand(command: string) {
    setAutopilotRunning(true);
    setAutopilotLog((prev) => [...prev, `$ ${command}`]);

    try {
      const res = await fetch('/api/devstudio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Autopilot command failed to start');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const payload = part.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;

          let line = payload;
          try {
            const parsed = JSON.parse(payload) as { line?: string; text?: string; output?: string };
            line = parsed.line ?? parsed.text ?? parsed.output ?? payload;
          } catch {
            // ignore JSON parse failures for raw lines
          }

          const cleaned = stripAnsi(line);
          if (cleaned.trim()) {
            setAutopilotLog((prev) => [...prev, cleaned]);
          }
        }
      }
    } catch (err) {
      setAutopilotLog((prev) => [
        ...prev,
        `✗ ${err instanceof Error ? err.message : 'Autopilot command failed'}`,
      ]);
    } finally {
      setAutopilotRunning(false);
    }
  }

  async function runOneClickEnvironment(env: 'staging' | 'production') {
    const environment = env === 'staging' ? 'staging' : 'production';
    setAutopilotRunning(true);
    setAutopilotLog((prev) => [...prev, `=== One-click ${env} pipeline started ===`]);

    try {
      await runMigrationCheck();
      await runAutopilotCommand('Run autopilot test suite');

      const dispatch = async (workflow: 'deploy-lms' | 'deploy-admin', label: string) => {
        setAutopilotLog((prev) => [...prev, `$ dispatch ${workflow} (${environment})`]);
        const res = await fetch('/api/devstudio/shell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow,
            inputs: {
              environment,
            },
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as { error?: string }).error ?? `${label} dispatch failed`);
        }

        setAutopilotLog((prev) => [
          ...prev,
          `✓ ${label} queued${(data as { runId?: number }).runId ? ` (#${(data as { runId: number }).runId})` : ''}`,
        ]);
      };

      await dispatch('deploy-lms', 'Deploy LMS');
      await dispatch('deploy-admin', 'Deploy Admin');

      setAutopilotLog((prev) => [...prev, `=== One-click ${env} pipeline complete ===`]);
    } catch (err) {
      setAutopilotLog((prev) => [
        ...prev,
        `✗ One-click ${env} failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      ]);
    } finally {
      setAutopilotRunning(false);
    }
  }

  async function linkScormToCourse() {
    const courseId = (selectedScormCourseId || programId || '').trim();
    const scormPackageId = selectedScormPackageId.trim();

    if (!courseId || !scormPackageId) {
      setError('Select both a course and SCORM package to link.');
      return;
    }

    setScormLinking(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/course-builder/scorm-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, scormPackageId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to link SCORM package');
      }

      setAutopilotLog((prev) => [...prev, `✓ SCORM package linked to course ${courseId}`]);

      const listRes = await fetch('/api/admin/course-builder/scorm-link');
      const listData = await listRes.json();
      if (listRes.ok && Array.isArray(listData.packages)) {
        setScormPackages(listData.packages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link SCORM');
    } finally {
      setScormLinking(false);
    }
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
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/dev-studio?tab=command&command=Build%20full%20premium%20course%20(blueprint%20%2B%20seed%20%2B%20assessments%20%2B%20queued%20videos)"
            className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Open Dev Studio Command
          </Link>
          <Link
            href="/admin/studio"
            className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Open Video Generator
          </Link>
        </div>
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

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Program Lookup</label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={programsLoading}
          >
            <option value="">{programsLoading ? 'Loading programs...' : 'Select a program'}</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}{program.slug ? ` (${program.slug})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Program ID (manual override)
          </label>
          <input
            type="text"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            placeholder="UUID from /admin/programs"
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

        <button
          onClick={handleBuildFullPremiumCourse}
          disabled={building || !programId.trim()}
          className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {building ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Building full premium course…
            </>
          ) : (
            <>Build Full Premium Course (Auto + Studio)</>
          )}
        </button>

        <div className="rounded-xl border border-slate-600 bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Rocket className="w-4 h-4 text-orange-400" />
            Generator Control Center
          </h3>
          <p className="text-xs text-slate-400">
            Central processing center for full-platform automation: spin up courses, run autopilots,
            verify migrations, and monitor live output.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <button
              onClick={() => runAutopilotCommand('Build all courses and push to GitHub')}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-xs font-medium disabled:opacity-50"
            >
              Build Courses Autopilot
            </button>
            <button
              onClick={() => runAutopilotCommand('Deploy the LMS service')}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded bg-brand-green-600 hover:bg-brand-green-700 text-white text-xs font-medium disabled:opacity-50"
            >
              Deploy LMS
            </button>
            <button
              onClick={() => runAutopilotCommand('Deploy the admin service')}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded bg-brand-green-600 hover:bg-brand-green-700 text-white text-xs font-medium disabled:opacity-50"
            >
              Deploy Admin
            </button>
            <button
              onClick={() => runAutopilotCommand('Run autopilot test suite')}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-medium disabled:opacity-50"
            >
              Run Autopilot Tests
            </button>
            <button
              onClick={runMigrationCheck}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded border border-slate-500 hover:border-orange-400 text-slate-100 text-xs font-medium disabled:opacity-50"
            >
              Check Supabase Migrations
            </button>
            <button
              onClick={() => runAutopilotCommand('Run a full platform smoke test')}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded border border-slate-500 hover:border-orange-400 text-slate-100 text-xs font-medium disabled:opacity-50"
            >
              Full Platform Smoke Test
            </button>
            <button
              onClick={() => runOneClickEnvironment('staging')}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium disabled:opacity-50"
            >
              One-Click Staging
            </button>
            <button
              onClick={() => runOneClickEnvironment('production')}
              disabled={autopilotRunning}
              className="px-3 py-2 rounded bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-medium disabled:opacity-50"
            >
              One-Click Production
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded border border-slate-700 p-2 text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-blue-400" />
              Supabase: {supabaseOk === null ? 'checking...' : supabaseOk ? 'connected' : 'error'}
            </div>
            <div className="rounded border border-slate-700 p-2 text-slate-300 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400" />
              Migrations: {migrationState?.success ? 'healthy' : 'needs attention'}
            </div>
            <div className="rounded border border-slate-700 p-2 text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-green-400" />
              Live feed: {liveLoading ? 'refreshing...' : 'active'}
            </div>
          </div>

          {migrationState?.results?.length ? (
            <div className="rounded border border-slate-700 overflow-hidden">
              <div className="px-3 py-1.5 bg-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                Migration Status
              </div>
              <div className="max-h-28 overflow-auto divide-y divide-slate-800">
                {migrationState.results.map((row, idx) => (
                  <div key={`${row.migration}-${idx}`} className="px-3 py-1.5 text-xs text-slate-300 flex items-center justify-between">
                    <span>{row.migration}</span>
                    <span className={row.status === 'EXISTS' ? 'text-brand-green-400' : 'text-orange-400'}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded border border-slate-700 overflow-hidden">
            <div className="px-3 py-1.5 bg-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
              Autopilot Log
            </div>
            <div className="max-h-40 overflow-auto bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-300 space-y-1">
              {autopilotLog.length === 0 ? (
                <div className="text-slate-500">No autopilot activity yet.</div>
              ) : (
                autopilotLog.slice(-120).map((line, idx) => <div key={`${idx}-${line.slice(0, 8)}`}>{line}</div>)
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-600 bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">SCORM Integration (Linked To Course Builder)</h3>
          <p className="text-xs text-slate-400">
            Link uploaded SCORM packages to canonical courses directly from the generator center.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedScormCourseId}
              onChange={(e) => setSelectedScormCourseId(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-white"
            >
              <option value="">Select course from live feed</option>
              {liveCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {(course.title || course.slug || course.id).slice(0, 80)}
                </option>
              ))}
            </select>

            <select
              value={selectedScormPackageId}
              onChange={(e) => setSelectedScormPackageId(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs text-white"
            >
              <option value="">{scormLoading ? 'Loading SCORM packages...' : 'Select SCORM package'}</option>
              {scormPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {(pkg.title || pkg.id).slice(0, 70)} {pkg.course_id ? '(linked)' : '(unlinked)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={linkScormToCourse}
              disabled={scormLinking || !selectedScormCourseId || !selectedScormPackageId}
              className="px-3 py-2 rounded bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-xs font-medium disabled:opacity-50"
            >
              {scormLinking ? 'Linking SCORM...' : 'Link SCORM To Course'}
            </button>
            <Link
              href="/admin/course-import"
              className="px-3 py-2 rounded border border-slate-500 hover:border-orange-400 text-slate-100 text-xs font-medium"
            >
              Open SCORM Import
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-600 bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Live Course Spin-Up Feed</h3>
          <p className="text-xs text-slate-400">
            Watch canonical courses appear live as they are generated. Auto-refreshes every 5 seconds.
          </p>
          <div className="text-[11px] text-slate-500">Last refresh: {liveTimestamp || 'pending'}</div>

          <div className="max-h-60 overflow-auto rounded border border-slate-700">
            <div className="grid grid-cols-[2fr_72px_72px_90px_90px] gap-2 px-3 py-2 bg-slate-800 text-[11px] text-slate-400 uppercase tracking-wide">
              <span>Course</span>
              <span>Modules</span>
              <span>Lessons</span>
              <span>Videos</span>
              <span>Queue</span>
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              {liveCourses.length === 0 ? (
                <div className="px-3 py-2 text-slate-500">No live course rows yet.</div>
              ) : (
                liveCourses.map((course) => (
                  <div key={course.id} className="grid grid-cols-[2fr_72px_72px_90px_90px] gap-2 px-3 py-2 text-slate-300 items-center">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{course.title || course.slug || course.id}</div>
                      <div className="truncate text-slate-500">{course.status || 'draft'} · {course.id.slice(0, 8)}</div>
                    </div>
                    <span>{course.moduleCount}</span>
                    <span>{course.lessonCount}</span>
                    <span>{course.videoComplete}/{course.videoPending + course.videoComplete}</span>
                    <span>{course.queuedJobs}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
