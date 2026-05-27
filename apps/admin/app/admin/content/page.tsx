import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import ContentManagerClient from './ContentManagerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Content Management | Admin | Elevate for Humanity',
  description: 'Edit team members, training partners, and site content without code changes.',
  robots: { index: false, follow: false },
};

export default async function ContentPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <ContentManagerClient />;
}
