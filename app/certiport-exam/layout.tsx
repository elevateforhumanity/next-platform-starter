import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certiport Exam Voucher',
  description:
    'Access your Certiport exam voucher for industry certification testing through Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/certiport-exam',
  },
  robots: { index: false },
};

export default function CertiportExamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
