import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getPlatformHealth } from '@/lib/platform/platform-health';
import SystemHealthClient from './SystemHealthClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System Health | Admin | Elevate for Humanity',
  description: 'Platform service status, connectivity checks, and active alerts.',
};

export default async function SystemHealthPage() {
  await requireRole(['admin', 'super_admin']);
  const snapshot = await getPlatformHealth();

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumbs
          items={[{ label: 'Admin', href: '/admin' }, { label: 'System Health' }]}
        />
        <SystemHealthClient initialSnapshot={snapshot} />
      </div>
    </div>
  );
}
