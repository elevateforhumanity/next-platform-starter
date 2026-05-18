import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  robots: { index: false, follow: false },
};

// Redirect to the main schedule page — no standalone schedule UI exists per-learner.
// The case manager can book a meeting via Calendly from the main schedule page.
export default async function LearnerSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/schedule?learner=${id}`);
}
