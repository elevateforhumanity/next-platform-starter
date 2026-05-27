import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import PageBuilderClient from './PageBuilderClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Page Builder | Admin | Elevate for Humanity',
  description: 'Create and edit public-facing pages without code changes.',
  robots: { index: false, follow: false },
};

export default async function PageBuilderPage() {
  await requireRole(['admin', 'super_admin']);
  return <PageBuilderClient />;
}
