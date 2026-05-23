import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login — Elevate for Humanity',
  description: 'Restricted administrator sign-in.',
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
