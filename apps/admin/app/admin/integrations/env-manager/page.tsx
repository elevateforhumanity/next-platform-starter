import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import EnvManagerClient from './EnvManagerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Integration Settings | Admin | Elevate LMS',
};

export default async function EnvManagerPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <EnvManagerClient />;
}
