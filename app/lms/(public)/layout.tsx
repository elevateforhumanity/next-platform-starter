import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// NOTE: do NOT add <html><body> here — this layout is nested inside app/layout.tsx
// which already provides the document shell. A nested html/body causes a broken
// double-document and is the root cause of the inconsistent shell the audit flagged.
// The clientReferenceManifest invariant is resolved by having any client component
// imported in this subtree (StudentToolsStrip in the page satisfies this).
export default function LmsPublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
