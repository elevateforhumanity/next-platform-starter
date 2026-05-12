import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify credential | Elevate for Humanity',
  description: 'Verify an Elevate for Humanity credential or program completion certificate by entering the certificate ID.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/verify-credential',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
