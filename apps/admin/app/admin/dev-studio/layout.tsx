import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export default async function DevStudioLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['super_admin', 'platform_operator']);

  return <div className="h-[calc(100vh-4rem)] min-h-[480px] overflow-hidden">{children}</div>;
}
