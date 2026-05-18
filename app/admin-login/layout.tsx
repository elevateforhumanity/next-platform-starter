import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Restricted administrator sign-in for Elevate For Humanity.',
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
