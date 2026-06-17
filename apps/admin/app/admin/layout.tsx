/**
 * Admin group layout - applies authentication to all /admin/* pages.
 * This ensures consistent auth behavior across all admin routes.
 */
import { requireRole } from '@/lib/auth/require-role';

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check for all admin routes
  // This applies to: /admin/certificates, /admin/credentials, /admin/rapids, etc.
  await requireRole(['admin', 'super_admin', 'staff', 'platform_operator', 'org_admin']);
  
  return <>{children}</>;
}
