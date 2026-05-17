// /apprentice/courses/[id] was a thin shell over the LMS course engine.
// Consolidated 2026-06 — all course rendering is in /lms/courses/[courseId].
// PUBLIC ROUTE: redirect only
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function ApprenticeCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/lms/courses/${id}`);
}
