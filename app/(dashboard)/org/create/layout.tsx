import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Org | Create',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/org/create',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
