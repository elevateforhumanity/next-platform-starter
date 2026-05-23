import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import SnapshotsClient from './SnapshotsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Platform Snapshots | Admin | Elevate for Humanity',
  description: 'View and roll back platform snapshots created before migrations, deploys, and config changes.',
  robots: { index: false, follow: false },
};

export default async function SnapshotsPage() {
  await requireAdmin();
  return <SnapshotsClient />;
}
