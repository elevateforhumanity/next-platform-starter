import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { Suspense } from 'react';
import DevStudioClient from './DevStudioClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Dev Studio | Admin | Elevate For Humanity',
};

export default async function DevStudioPage() {
  await requireRole(['admin', 'super_admin']);
  return (
    <Suspense fallback={null}>
      <DevStudioClient />
    </Suspense>
  );
}
