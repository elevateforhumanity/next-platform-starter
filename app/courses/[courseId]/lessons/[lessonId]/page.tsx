import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function LegacyCourseRoute({ params }: { params: { courseId: string; lessonId?: string } }) {
  const { courseId, lessonId } = params as { courseId: string; lessonId?: string };
  redirect(`/lms/courses/${courseId}/lessons/${lessonId}`);
}
