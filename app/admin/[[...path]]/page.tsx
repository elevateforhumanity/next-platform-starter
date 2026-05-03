import { redirect } from 'next/navigation';

// Admin app catch-all — redirects to the admin app at NEXT_PUBLIC_ADMIN_URL.
// NEXT_PUBLIC_ADMIN_URL is set via SSM /elevate/NEXT_PUBLIC_ADMIN_URL and
// baked in at build time. Falls back to app.elevateforhumanity.org.
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
