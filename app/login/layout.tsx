import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Elevate for Humanity',
  description:
    'Sign in to your Elevate for Humanity account to access your training programs and career services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/login',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // MarketingChromeGuard hides header/footer on /login via data-app-route.
  // This layout provides the dark centered shell for the auth form.
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {children}
    </div>
  );
}
