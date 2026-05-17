// /courses/[courseId] was a duplicate shell over /lms/courses/[courseId].
// Consolidated 2026-06. The learn sub-route already did permanentRedirect.
// PUBLIC ROUTE: redirect only
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function LegacyCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  permanentRedirect(`/lms/courses/${courseId}`);
}
