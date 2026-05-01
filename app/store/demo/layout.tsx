import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Store Demo | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function StoreDemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
