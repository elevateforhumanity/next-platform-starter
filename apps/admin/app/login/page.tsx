import { redirect } from 'next/navigation';

function getSafeRedirect(raw: string | undefined) {
  if (!raw) return '/admin/dashboard';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
    return '/admin/dashboard';
  }
  return raw;
}

export default async function AdminLoginHandoffPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const target = getSafeRedirect(params.redirect);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.elevateforhumanity.org';
  redirect(`${siteUrl}/login?redirect=${encodeURIComponent(target)}`);
}
