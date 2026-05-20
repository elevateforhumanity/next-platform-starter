import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apprentice Portal — Elevate for Humanity',
  description: 'Track your apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default function ApprenticePortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
