import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { SignDocumentsClient } from './SignDocumentsClient';


export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Sign Documents | Elevate for Humanity',
  description: 'Draw and save your signature, then apply it to W-9 and ACH enrollment forms.',
};

export default async function SignDocumentsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return <SignDocumentsClient />;
}
