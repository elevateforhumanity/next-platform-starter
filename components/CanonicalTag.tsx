import { headers } from 'next/headers';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export async function CanonicalTag() {
  const headersList = await headers();
  const host = headersList.get('host') || PLATFORM_DEFAULTS.canonicalDomain;
  const pathname = headersList.get('x-pathname') || '/';

  const canonicalUrl = `https://${host}${pathname}`;

  return <link rel="canonical" href={canonicalUrl} />;
}
