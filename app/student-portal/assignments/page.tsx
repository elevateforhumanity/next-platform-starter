import { permanentRedirect } from 'next/navigation';

export default function StudentPortalAssignmentsPage() {
  permanentRedirect('/lms/assignments');
}
