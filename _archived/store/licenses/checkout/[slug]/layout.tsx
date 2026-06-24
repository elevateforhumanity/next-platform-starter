import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'License Checkout | {PLATFORM_DEFAULTS.orgName}',
  robots: { index: false, follow: false },
};

export default async function LicenseCheckoutLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!SLUG.test(slug) || slug.length > 200) notFound();

  return children;
}
