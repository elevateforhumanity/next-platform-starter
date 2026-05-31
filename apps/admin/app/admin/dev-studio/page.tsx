import { requireRole } from '@/lib/auth/require-role';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Metadata } from 'next';
import { Suspense } from 'react';
import DevStudioUnifiedClient from './DevStudioUnifiedClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Dev Studio | Admin | ${PLATFORM_DEFAULTS.orgName}`,
};

export default async function DevStudioPage() {
  const auth = await requireRole(['admin', 'super_admin']);
  const isSuperAdmin = auth.effectiveRoles.includes('super_admin');
  return (
    <Suspense fallback={null}>
      <DevStudioControlPlaneClient isSuperAdmin={isSuperAdmin} />
    </Suspense>
  );
}
