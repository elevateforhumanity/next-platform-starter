import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

import { ClientBoundary } from './_client-boundary';

// NOTE: do NOT add <html><body> here — this layout is nested inside app/layout.tsx
// which already provides the document shell. A nested html/body causes a broken
// double-document and is the root cause of the inconsistent shell the audit flagged.
// ClientBoundary satisfies the Next.js clientReferenceManifest requirement for
// this route group without needing a document-level wrapper.
export default function LmsPublicLayout({ children }: { children: React.ReactNode }) {
  return <ClientBoundary>{children}</ClientBoundary>;
}
