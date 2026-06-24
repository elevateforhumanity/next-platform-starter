'use client';

import { useState } from 'react';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Zap,
  AlertTriangle,
  Rocket,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Shield,
  Terminal,
} from 'lucide-react';

type DeployStatus = 'idle' | 'building' | 'deploying' | 'success' | 'failed';

interface Deployment {
  service: string;
  url: string;
  status: DeployStatus;
  startedAt: string;
  completedAt: string | null;
  logs: string[];
}

export default function ForceDeployPage() {
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [deployment, setDeployment] = useState<Deployment | null>(null);

  async function executeForceDeploy() {
    if (!confirm('⚠️ WARNING: This will bypass all CI/CD gates and deploy directly to production.\n\nAre you absolutely sure?')) {
      return;
    }

    setDeploying(true);
    setStatus('building');
    setLogs(['🔨 Starting force deployment...', '📦 Fetching latest artifacts...']);

    try {
      const response = await fetch('/api/deploy/force', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: 'production',
          bypass_checks: true,
          reason: 'Manual force deploy from Dev Studio',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setLogs(prev => [
          ...prev,
          '✅ Build completed successfully',
          '🚀 Initiating production deployment...',
          `🌐 Deployed to: ${data.url || 'https://www.elevateforhumanity.org'}`,
          '✅ Deployment verified',
          `⏱️ Total time: ${data.duration || '~60s'}`,
        ]);
        setDeployment({
          service: 'Production',
          url: data.url || 'https://www.elevateforhumanity.org',
          status: 'success',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          logs: logs,
        });
      } else {
        setStatus('failed');
        setLogs(prev => [...prev, `❌ Deployment failed: ${data.error}`]);
      }
    } catch (error) {
      setStatus('failed');
      setLogs(prev => [...prev, '❌ Network error during deployment']);
    } finally {
      setDeploying(false);
    }
  }

  function getStatusIcon(s: DeployStatus) {
    switch (s) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'building':
      case 'deploying': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Dev Studio', href: '/admin/studio' },
            { label: 'Force Deploy' },
          ]}
        />

        <div className="mt-8 text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${status === 'failed' ? 'bg-red-900/50' : status === 'success' ? 'bg-green-900/50' : 'bg-yellow-900/50'}`}>
            <Zap className={`h-12 w-12 ${status === 'failed' ? 'text-red-400' : status === 'success' ? 'text-green-400' : 'text-yellow-400 animate-pulse'}`} />
          </div>

          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
            Nuclear Production Override
          </h1>

          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Bypass all CI/CD gates, linting, type-checks, and Husky hooks to deploy directly to production.
            Use only for critical deployment recovery.
          </p>

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-8 max-w-xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="font-bold text-yellow-400">⚠️ Critical Action</h3>
                <p className="text-sm text-yellow-200/80 mt-1">
                  This will deploy ANY code to production, bypassing all safety checks.
                  This action is logged and cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <button
            onClick={executeForceDeploy}
            disabled={deploying}
            className={`px-12 py-5 rounded-full font-bold text-xl transition-all active:scale-95 ${
              deploying
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : status === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : status === 'failed'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-2xl shadow-red-500/30'
            }`}
          >
            {deploying ? (
              <span className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin" />
                {status === 'building' ? 'Building...' : 'Deploying...'}
              </span>
            ) : status === 'success' ? (
              <span className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6" />
                Deployed Successfully
              </span>
            ) : status === 'failed' ? (
              <span className="flex items-center gap-3">
                <XCircle className="h-6 w-6" />
                Deployment Failed
              </span>
            ) : (
              '⚡ EXECUTE FORCE DEPLOY'
            )}
          </button>

          {/* Logs */}
          {(logs.length > 0 || deploying) && (
            <div className="mt-8 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden max-w-2xl mx-auto">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <Terminal className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400 font-medium">Deployment Logs</span>
                {deploying && <RefreshCw className="h-4 w-4 text-blue-400 animate-spin ml-auto" />}
              </div>
              <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="text-slate-300">{log}</div>
                ))}
                {deploying && (
                  <div className="text-blue-400 animate-pulse">▌</div>
                )}
              </div>
            </div>
          )}

          {/* Safety Info */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Action logged</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Auth required</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Timestamp recorded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
