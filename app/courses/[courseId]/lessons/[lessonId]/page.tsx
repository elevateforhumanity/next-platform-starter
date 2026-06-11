import { redirect } from 'next/navigation';

export default function LegacyCourseRoute({ params }: { params: { courseId: string; lessonId?: string } }) {
  const { courseId, lessonId } = params as { courseId: string; lessonId?: string };
  redirect(`/lms/courses/${courseId}/lessons/${lessonId}`);
}
