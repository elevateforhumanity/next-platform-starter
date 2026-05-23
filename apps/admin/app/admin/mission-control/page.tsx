import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import {
  Activity,
  ShieldCheck,
  Bot,
  Terminal,
  BarChart3,
  DatabaseBackup,
  FileSearch,
  Key,
  UserCog,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mission Control | Admin | Elevate for Humanity',
  description: 'Centralized platform operations and AI orchestration.',
  robots: { index: false, follow: false },
};

const modules = [
  {
    title: 'Command Center',
    href: '/admin/command-center',
    icon: Activity,
    description: 'Platform observability and QA',
  },
  {
    title: 'Dev Studio',
    href: '/admin/dev-studio',
    icon: Terminal,
    description: 'AI execution + git operations',
  },
  {
    title: 'System Health',
    href: '/admin/system-health',
    icon: ShieldCheck,
    description: 'Infrastructure + DB health',
  },
  {
    title: 'Monitoring',
    href: '/admin/monitoring',
    icon: BarChart3,
    description: 'Metrics + operational tracking',
  },
  {
    title: 'Automation',
    href: '/admin/automation',
    icon: Bot,
    description: 'Workflow + cron visibility',
  },
  {
    title: 'Snapshots',
    href: '/admin/snapshots',
    icon: DatabaseBackup,
    description: 'Rollback + restore management',
  },
  {
    title: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: FileSearch,
    description: 'Full audit visibility',
  },
  {
    title: 'API Keys',
    href: '/admin/api-keys',
    icon: Key,
    description: 'Credential management',
  },
  {
    title: 'Impersonation',
    href: '/admin/impersonate',
    icon: UserCog,
    description: 'Secure role simulation',
  },
  {
    title: 'Copilot',
    href: '/admin/copilot',
    icon: Sparkles,
    description: 'AI operational assistant',
  },
];

export default async function MissionControlPage() {
  await requireAdmin();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Mission Control</h1>
        <p className="text-muted-foreground mt-2">
          Centralized platform operations and AI orchestration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-2xl border p-5 bg-background hover:bg-muted/50 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl p-2 bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{module.title}</div>
              </div>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
