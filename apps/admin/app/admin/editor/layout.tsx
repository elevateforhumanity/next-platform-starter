import { Metadata } from 'next';

export const metadata: Metadata = {
  title: ' | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  robots: {
    index: false,
    follow: false,
  },
};

// Full-bleed layout for the code editor — cancels the pt-16 from the admin
// layout's <main> so the editor can fill the viewport from the nav baseline.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mt-16 overflow-hidden" style={{ height: '100dvh' }}>
      {children}
    </div>
  );
}
