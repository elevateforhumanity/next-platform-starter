'use client';

// Satisfies Next.js clientReferenceManifest requirement for this route group.
// Without at least one client component in the (public) subtree, Next.js throws
// "Expected clientReferenceManifest to be defined" at runtime.
// This file is imported by layout.tsx and does nothing else.
export function ClientBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
