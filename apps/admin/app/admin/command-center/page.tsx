import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import CommandCenterClient from './CommandCenterClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Command Center | Admin | Elevate for Humanity',
  description: 'Live platform observability — events, QA, snapshots, system health.',
  robots: { index: false, follow: false },
};

export default async function CommandCenterPage() {
  await requireAdmin();
  return <CommandCenterClient />;
}
