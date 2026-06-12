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
  const auth = await requireRole(['super_admin', 'platform_operator']);
  const isSuperAdmin = auth.effectiveRoles.some((role) => role === 'super_admin' || role === 'platform_operator');
  return (
    <Suspense fallback={null}>
      <DevStudioUnifiedClient isSuperAdmin={isSuperAdmin} />
    </Suspense>
  );
}
