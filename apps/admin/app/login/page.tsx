import { redirect } from 'next/navigation';
import { getCanonicalLoginBaseUrl } from '../../lib/login-url';

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
  redirect(`${getCanonicalLoginBaseUrl()}/login?redirect=${encodeURIComponent(target)}`);
}
