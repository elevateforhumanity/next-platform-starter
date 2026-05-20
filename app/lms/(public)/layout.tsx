import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// NOTE: do NOT add <html><body> here — this layout is nested inside app/layout.tsx
// which already provides the document shell.
export default function LmsPublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
