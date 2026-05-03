import { redirect } from 'next/navigation';

// The admin application runs at app.elevateforhumanity.org (apps/admin).
// Any /admin/* hit on the main site redirects there, preserving the path.
// This prevents 500s when unauthenticated users or bookmarks hit /admin/* directly.
export const dynamic = 'force-dynamic';

export default async function AdminCatchAll({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const adminBase =
    process.env.NEXT_PUBLIC_ADMIN_URL || 'https://app.elevateforhumanity.org';
  const subPath = path?.length ? `/${path.join('/')}` : '/dashboard';
  redirect(`${adminBase}/admin${subPath}`);
}
