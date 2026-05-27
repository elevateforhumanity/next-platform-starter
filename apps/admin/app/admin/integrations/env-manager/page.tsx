import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import EnvManagerClient from './EnvManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Integration Settings | Admin | Elevate LMS',
};

export default async function EnvManagerPage() {
  await requireAdmin();
  return <EnvManagerClient />;
}
