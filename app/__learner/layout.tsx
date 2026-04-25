import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/require-user';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Learner Portal | Elevate For Humanity',
  description: 'Access your courses, track progress, and manage your career training journey.',
  robots: { index: false, follow: false },
};

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  // Single server-side gate — proxy.ts handles anonymous users at the edge,
  // this confirms the session is valid before rendering any learner page.
  await requireUser();

  return <>{children}</>;
}
