'use client';

import { useState, useEffect } from 'react';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Box,
  Server,
  Database,
  Globe,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react';

interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  status: 'running' | 'stopped' | 'error';
  url: string;
  created_at: string;
  last_deployed: string;
  containers: number;
  cpu: number;
  memory: number;
}

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  async function fetchEnvironments() {
    setLoading(true);
    try {
      const res = await fetch('/api/environments');
      if (res.ok) {
        const data = await res.json();
        setEnvironments(data);
      } else {
        // Fallback demo data
        setEnvironments([
          {
            id: '1',
            name: 'Production',
            type: 'production',
            status: 'running',
            url: 'https://www.elevateforhumanity.org',
            created_at: '2024-01-15',
            last_deployed: '2026-06-24',
            containers: 8,
            cpu: 45,
            memory: 62,
          },
          {
            id: '2',
            name: 'Staging',
            type: 'staging',
            status: 'running',
            url: 'https://staging.elevateforhumanity.org',
            created_at: '2024-03-20',
            last_deployed: '2026-06-23',
            containers: 4,
            cpu: 23,
            memory: 31,
          },
          {
            id: '3',
            name: 'Development',
            type: 'development',
            status: 'running',
            url: 'http://localhost:3000',
            created_at: '2024-01-01',
            last_deployed: '2026-06-24',
            containers: 2,
            cpu: 12,
            memory: 18,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch environments:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'running': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'stopped': return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'production': return 'bg-red-100 text-red-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'development': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Dev Studio', href: '/admin/studio' },
            { label: 'Environments' },
          ]}
        />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Box className="h-8 w-8 text-brand-orange-500" />
              <div>
                <h1 className="text-2xl font-bold">Container Environments</h1>
                <p className="text-slate-500 text-sm">Manage development containers and runtime environments</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-lg transition-colors">
              <Plus className="h-5 w-5" />
              New Environment
            </button>
          </div>

          {/* Environments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {environments.map(env => (
              <div key={env.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Server className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{env.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(env.type)}`}>
                          {env.type}
                        </span>
                      </div>
                    </div>
                    {getStatusIcon(env.status)}
                  </div>

                  <div className="space-y-3 mb-4">
                    <a href={env.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <Globe className="h-4 w-4" />
                      {env.url}
                    </a>
                  </div>

                  {/* Resource Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Cpu className="h-4 w-4" />
                        <span>CPU</span>
                      </div>
                      <span className="font-medium">{env.cpu}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${env.cpu}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MemoryStick className="h-4 w-4" />
                        <span>Memory</span>
                      </div>
                      <span className="font-medium">{env.memory}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${env.memory}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        <span>Containers</span>
                      </div>
                      <span className="font-medium">{env.containers}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Last deployed: {env.last_deployed}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                      <RefreshCw className="h-4 w-4 text-slate-500" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-200 rounded transition-colors">
                      {env.status === 'running' ? (
                        <Pause className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Play className="h-4 w-4 text-green-500" />
                      )}
                    </button>
                    <button className="p-1.5 hover:bg-red-100 rounded transition-colors">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
