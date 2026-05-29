export const dynamic = 'force-dynamic';

import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import ToasterClient from '@/components/ui/ToasterClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getAdminUrl()),
  title: {
    default: 'Elevate Admin',
    template: '%s | Elevate Admin',
  },
  description: `${PLATFORM_DEFAULTS.orgName} — Admin Portal`,
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        {/* Single Toaster mount for the entire admin app — covers /admin, /instructor, /login */}
        <ToasterClient />
      </body>
    </html>
  );
}
