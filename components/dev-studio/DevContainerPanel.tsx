'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, CheckCircle, AlertCircle, Box } from 'lucide-react';

interface DevContainerConfig {
  name?: string;
  image?: string;
  forwardPorts?: number[];
  portsAttributes?: Record<string, { label?: string; onAutoForward?: string }>;
  features?: Record<string, unknown>;
  onCreateCommand?: string;
  postCreateCommand?: string;
  postStartCommand?: string;
  remoteEnv?: Record<string, string>;
  customizations?: {
    vscode?: {
      extensions?: string[];
      settings?: Record<string, unknown>;
    };
  };
}

export default function DevContainerPanel() {
  const [raw, setRaw] = useState('');
  const [sha, setSha] = useState('');
  const [parsed, setParsed] = useState<DevContainerConfig | null>(null);
  const [editedRaw, setEditedRaw] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/devstudio/devcontainer');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRaw(data.raw);
      setSha(data.sha ?? '');
      setParsed(data.parsed);
      setEditedRaw(data.raw);
      setParseError(null);
    } catch {
      setStatus({ type: 'error', message: 'Could not load devcontainer.json' });
    } finally {
      setLoading(false);
    }
  };

  const handleRawChange = (value: string) => {
    setEditedRaw(value);
    try {
      const p = JSON.parse(value);
      setParsed(p);
      setParseError(null);
    } catch (e) {
      setParseError((e as SyntaxError).message);
      // Switch to raw tab so the user can see and fix the error — staying on
      // Visual with parsed=null would silently fall through to the raw editor
      // with no indication of what happened.
      setActiveTab('raw');
    }
  };

  const save = async () => {
    if (parseError) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/devstudio/devcontainer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // sha is required by the GitHub Contents API to update an existing file
        body: JSON.stringify({ content: editedRaw, sha }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      const result = await res.json();
      setRaw(editedRaw);
      // Update sha so subsequent saves use the new blob sha
      if (result.sha) setSha(result.sha);
      setStatus({
        type: 'success',
        message: result.commit
          ? `Committed — ${result.commit}`
          : 'devcontainer.json committed to main',
      });
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = editedRaw !== raw;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading devcontainer.json…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-brand-blue-600" />
          <span className="font-semibold text-sm text-slate-700">.devcontainer/devcontainer.json</span>
          {hasChanges && (
            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            title="Reload from disk"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={!hasChanges || !!parseError || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Status bar */}
      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-2 text-sm flex-shrink-0 ${
            status.type === 'success'
              ? 'bg-green-900/50 text-green-300'
              : 'bg-red-900/50 text-red-300'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {status.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 flex-shrink-0">
        {(['visual', 'raw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-brand-blue-500 text-brand-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'visual' ? 'Visual' : 'Raw JSON'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'visual' && parsed === null ? (
          // parsed is null only when JSON is invalid — handleRawChange switches
          // to raw tab in that case, so this branch is a safety fallback only
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
            Invalid JSON — switch to Raw JSON tab to fix the error.
          </div>
        ) : activeTab === 'visual' ? (
          <div className="p-4 space-y-6">
            {/* Name & Image */}
            <Section title="Container">
              <Field label="Name" value={parsed.name} />
              <Field label="Base Image" value={parsed.image} mono />
            </Section>

            {/* Ports */}
            {parsed.forwardPorts && parsed.forwardPorts.length > 0 && (
              <Section title="Forwarded Ports">
                <div className="flex flex-wrap gap-2">
                  {parsed.forwardPorts.map((p) => (
                    <span
                      key={p}
                      className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded font-mono text-sm"
                    >
                      :{p}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Features */}
            {parsed.features && Object.keys(parsed.features).length > 0 && (
              <Section title="Features">
                <div className="space-y-1">
                  {Object.keys(parsed.features).map((f) => (
                    <div
                      key={f}
                      className="font-mono text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Lifecycle commands — the platform's central processing hooks */}
            {parsed.onCreateCommand && (
              <Section title="On Create (runs once on first build)">
                <code className="block bg-slate-100 px-3 py-2 rounded text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                  {parsed.onCreateCommand}
                </code>
              </Section>
            )}
            {parsed.postCreateCommand && (
              <Section title="Post Create (runs after image build)">
                <code className="block bg-slate-100 px-3 py-2 rounded text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                  {parsed.postCreateCommand}
                </code>
              </Section>
            )}
            {parsed.postStartCommand && (
              <Section title="Post Start (runs on every container start)">
                <code className="block bg-slate-100 px-3 py-2 rounded text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                  {parsed.postStartCommand}
                </code>
              </Section>
            )}

            {/* Remote env */}
            {parsed.remoteEnv && Object.keys(parsed.remoteEnv).length > 0 && (
              <Section title="Remote Environment Variables">
                <div className="space-y-1">
                  {Object.entries(parsed.remoteEnv).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2 font-mono text-xs bg-slate-100 px-3 py-1.5 rounded">
                      <span className="text-blue-300 flex-shrink-0">{k}</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-slate-700 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Port attributes */}
            {parsed.portsAttributes && Object.keys(parsed.portsAttributes).length > 0 && (
              <Section title="Port Configuration">
                <div className="space-y-1">
                  {Object.entries(parsed.portsAttributes).map(([port, cfg]) => (
                    <div key={port} className="flex items-center gap-3 text-xs bg-slate-100 px-3 py-1.5 rounded">
                      <span className="font-mono text-blue-300">:{port}</span>
                      <span className="text-slate-700">{cfg.label}</span>
                      {cfg.onAutoForward && (
                        <span className="text-slate-500 ml-auto">{cfg.onAutoForward}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* VS Code extensions */}
            {parsed.customizations?.vscode?.extensions && (
              <Section title="VS Code Extensions">
                <div className="grid grid-cols-2 gap-1">
                  {parsed.customizations.vscode.extensions.map((ext) => (
                    <div
                      key={ext}
                      className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded font-mono truncate"
                    >
                      {ext}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* VS Code settings */}
            {parsed.customizations?.vscode?.settings && (
              <Section title="VS Code Settings">
                <pre className="text-xs text-slate-700 bg-slate-100 px-3 py-2 rounded overflow-auto">
                  {JSON.stringify(parsed.customizations.vscode.settings, null, 2)}
                </pre>
              </Section>
            )}
          </div>
        ) : (
          // Raw JSON tab
          <div className="h-full flex flex-col">
            {parseError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-900/40 text-red-300 text-xs flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                JSON error: {parseError}
              </div>
            )}
            <textarea
              value={editedRaw}
              onChange={(e) => handleRawChange(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-white text-slate-700 font-mono text-xs p-4 resize-none outline-none border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 mb-1">
      <span className="text-xs text-slate-500 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
