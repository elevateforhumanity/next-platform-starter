import { redirect } from 'next/navigation';

// Course builder is now the Studio.
// /admin/course-builder → /admin/studio
export default function CourseBuilderPage() {
  redirect('/admin/studio');
}
