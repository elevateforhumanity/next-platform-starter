import { redirect } from 'next/navigation';

export default async function CourseLessonsRedirect({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  redirect(`/lms/courses/${courseId}`);
}
