// Canonical: /programs/cpr-first-aid — redirect handled by next.config.mjs
// This stub exists only to support sub-routes in this directory.
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect('/programs/cpr-first-aid');
}
