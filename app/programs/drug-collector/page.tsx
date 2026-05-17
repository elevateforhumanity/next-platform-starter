// Canonical slug is drug-alcohol-specimen-collector. Consolidated 2026-06.
// PUBLIC ROUTE: redirect only
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function DrugCollectorRedirect() {
  permanentRedirect('/programs/drug-alcohol-specimen-collector');
}
