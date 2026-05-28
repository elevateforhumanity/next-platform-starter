import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'License Purchase Success | {PLATFORM_DEFAULTS.orgName}',
  robots: { index: false, follow: false },
};

export default function LicenseSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
