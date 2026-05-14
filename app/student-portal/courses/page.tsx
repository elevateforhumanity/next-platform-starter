import { permanentRedirect } from 'next/navigation';

export default function StudentPortalCoursesPage() {
  permanentRedirect('/lms/courses');
}
