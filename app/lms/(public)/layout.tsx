import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Explicit html/body wrapper forces Next.js to generate a
// clientReferenceManifest for this route group, preventing the
// "Expected clientReferenceManifest to be defined" invariant error.
export default function LmsPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
