export const dynamic = 'force-dynamic';

import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ToasterClient from '@/components/ui/ToasterClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';

const ADMIN_METADATA_BASE =
  (process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org').replace(
    /\/+$/,
    '',
  );

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(ADMIN_METADATA_BASE),
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
      <head>
        <SupabasePublicConfigScript />
      </head>
      <body className="font-sans antialiased">
        {children}
        {/* Single Toaster mount for the entire admin app — covers /admin, /instructor, /login */}
        <ToasterClient />
      </body>
    </html>
  );
}
