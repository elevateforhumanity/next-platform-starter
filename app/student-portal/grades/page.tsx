import { permanentRedirect } from 'next/navigation';

export default function StudentPortalGradesPage() {
  permanentRedirect('/lms/grades');
}
