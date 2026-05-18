import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ai | Job match',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ai/job-match',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
