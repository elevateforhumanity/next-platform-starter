import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Canonical apply page: /programs/hvac-technician/apply
// /programs/hvac redirects to /programs/hvac-technician (see next.config.mjs legacyAliases).
// This page ensures /programs/hvac/apply follows the same canonical path rather than
// serving a stale static info page.
export default function Page() {
  redirect('/programs/hvac-technician/apply');
}
