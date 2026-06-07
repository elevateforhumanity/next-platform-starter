import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Login',
  description:
    `Sign in to your ${PLATFORM_DEFAULTS.orgName} account to access your training programs and career services.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/login',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // Marketing Header from PublicLayout stays visible (see lib/layout/app-routes.ts).
  // pt-[60px] clears the fixed site header.
  return <div className="min-h-screen bg-slate-50 pt-[60px]">{children}</div>;
}
