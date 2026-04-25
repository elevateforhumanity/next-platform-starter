import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Apprentice dashboard, hours, documents, and training.',
};
export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
